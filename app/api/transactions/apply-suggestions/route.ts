import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import { suggestUserCategoryFromPlaid } from "@/lib/transactions/suggest-user-category";
import mongoose from "mongoose";

const bodySchema = z.object({ beneficiaryId: z.string().min(1) }).strict();

const MAX_PER_REQUEST = 1500;

/**
 * Bulk-apply Plaid personal-finance-category heuristics to rows still marked `unclear`.
 * Does not set `lastUserEditedAt` (user can still override via PATCH).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { beneficiaryId } = parsed.data;
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const benId = new mongoose.Types.ObjectId(beneficiaryId);

  const candidates = await Transaction.find({
    beneficiaryId: benId,
    userCategory: "unclear",
    pfcPrimary: { $exists: true, $nin: ["", null] },
  })
    .select({ _id: 1, amountCents: 1, pfcPrimary: 1, pfcDetailed: 1 })
    .limit(MAX_PER_REQUEST)
    .lean();

  const ops: Parameters<typeof Transaction.bulkWrite>[0] = [];
  for (const t of candidates) {
    const suggested = suggestUserCategoryFromPlaid({
      amountCents: t.amountCents,
      pfcPrimary: t.pfcPrimary,
      pfcDetailed: t.pfcDetailed,
    });
    if (suggested) {
      ops.push({
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { userCategory: suggested } },
        },
      });
    }
  }

  let modified = 0;
  if (ops.length > 0) {
    const res = await Transaction.bulkWrite(ops, { ordered: false });
    modified = res.modifiedCount ?? 0;
  }

  return NextResponse.json({
    scanned: candidates.length,
    updated: modified,
  });
}
