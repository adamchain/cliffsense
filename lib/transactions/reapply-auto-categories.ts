import type { Types } from "mongoose";
import Transaction from "@/lib/db/models/Transaction";
import { suggestUserCategoryFromPlaid } from "@/lib/transactions/suggest-user-category";

const MAX_PER_RUN = 2000;

/**
 * Upgrade unedited rows that heuristics can now classify as income/benefits.
 * Safe to call on every sync / dashboard load — only touches unclear/transfer/
 * other_income when lastUserEditedAt is null.
 */
export async function reapplyAutoCategoriesForBeneficiary(
  beneficiaryId: Types.ObjectId,
): Promise<{ scanned: number; updated: number }> {
  const candidates = await Transaction.find({
    beneficiaryId,
    lastUserEditedAt: null,
    userCategory: { $in: ["unclear", "transfer", "other_income"] },
  })
    .select({
      _id: 1,
      amountCents: 1,
      pfcPrimary: 1,
      pfcDetailed: 1,
      name: 1,
      merchantName: 1,
      category: 1,
      userCategory: 1,
    })
    .limit(MAX_PER_RUN)
    .lean();

  const ops: Parameters<typeof Transaction.bulkWrite>[0] = [];
  for (const t of candidates) {
    const suggested = suggestUserCategoryFromPlaid({
      amountCents: t.amountCents,
      pfcPrimary: t.pfcPrimary,
      pfcDetailed: t.pfcDetailed,
      name: t.name,
      merchantName: t.merchantName,
      category: t.category,
    });
    if (!suggested || suggested === t.userCategory) continue;
    if (
      suggested !== "earned_income" &&
      suggested !== "benefit_deposit" &&
      suggested !== "other_income" &&
      t.userCategory !== "unclear"
    ) {
      continue;
    }
    // Never "upgrade" transfer → other_income noise; only clear income signals.
    if (
      t.userCategory === "transfer" &&
      suggested !== "earned_income" &&
      suggested !== "benefit_deposit"
    ) {
      continue;
    }
    ops.push({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { userCategory: suggested } },
      },
    });
  }

  let updated = 0;
  if (ops.length > 0) {
    const res = await Transaction.bulkWrite(ops, { ordered: false });
    updated = res.modifiedCount ?? 0;
  }
  return { scanned: candidates.length, updated };
}
