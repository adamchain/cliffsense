import type { Types } from "mongoose";
import ClassificationRule from "@/lib/db/models/ClassificationRule";
import { normalizeMerchantKey } from "@/lib/transactions/similar";

export const RECURRING_EXCLUSION_REASON =
  "Benefit deposit left out of program totals. The same amount from this payor stays out.";

type RuleLike = {
  _id?: Types.ObjectId;
  active?: boolean;
  matcher?: {
    merchantName?: string | null;
    amountMinCents?: number | null;
    amountMaxCents?: number | null;
  } | null;
    action?: {
    userCategory?: string | null;
    excludeFromThresholds?: boolean | null;
    excludedPrograms?: string[] | null;
    reason?: string | null;
  } | null;
};

export function exclusionRuleMatches(
  rule: RuleLike,
  tx: { merchantName?: string | null; name?: string | null; amountCents: number },
): boolean {
  const leavesSomeProgramsOut = (rule.action?.excludedPrograms?.length ?? 0) > 0;
  if (rule.active === false || (!rule.action?.excludeFromThresholds && !leavesSomeProgramsOut)) return false;
  const wanted = normalizeMerchantKey(rule.matcher?.merchantName ?? "");
  const merchant = normalizeMerchantKey(tx.merchantName ?? "");
  const name = normalizeMerchantKey(tx.name ?? "");
  if (!wanted || (merchant !== wanted && name !== wanted)) return false;
  const min = rule.matcher?.amountMinCents;
  const max = rule.matcher?.amountMaxCents;
  if (typeof min === "number" && tx.amountCents < min) return false;
  if (typeof max === "number" && tx.amountCents > max) return false;
  return true;
}

export async function saveRecurringExclusionRule(input: {
  beneficiaryId: Types.ObjectId;
  userId: string;
  merchantName: string;
  amountCents: number;
  userCategory: string;
  excluded: boolean;
  excludedPrograms?: string[];
}): Promise<void> {
  const merchantName = normalizeMerchantKey(input.merchantName);
  if (!merchantName || !input.amountCents) return;
  const excludedPrograms = [...new Set((input.excludedPrograms ?? []).map((program) => program.trim()).filter(Boolean))];
  const filter = {
    beneficiaryId: input.beneficiaryId,
    scope: "amount-range" as const,
    "matcher.merchantName": merchantName,
    "matcher.amountMinCents": input.amountCents,
    "matcher.amountMaxCents": input.amountCents,
  };
  if (!input.excluded && excludedPrograms.length === 0) {
    await ClassificationRule.updateMany(filter, { $set: { active: false } });
    return;
  }
  const reason = input.excluded
    ? RECURRING_EXCLUSION_REASON
    : `Left out of ${excludedPrograms.join(", ")}. The same amount from this payor stays out of those programs.`;
  await ClassificationRule.findOneAndUpdate(
    filter,
    {
      $set: {
        active: true,
        createdByUserId: input.userId,
        "action.userCategory": input.userCategory,
        "action.excludeFromThresholds": input.excluded,
        "action.excludedPrograms": excludedPrograms,
        "action.reason": reason,
      },
      $setOnInsert: {
        beneficiaryId: input.beneficiaryId,
        scope: "amount-range",
        matcher: {
          merchantName,
          descriptionRegex: "",
          amountMinCents: input.amountCents,
          amountMaxCents: input.amountCents,
          recurringStreamId: null,
        },
      },
    },
    { upsert: true },
  );
}
