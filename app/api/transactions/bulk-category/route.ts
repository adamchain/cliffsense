import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import {
  rowMatchesSimilar,
  similarMatchFrom,
  similarPrefilter,
} from "@/lib/transactions/similar";

const bodySchema = z.object({
  sourceTransactionId: z.string().min(1),
  userCategory: z.enum([
    "earned_income",
    "benefit_deposit",
    "other_income",
    "expense",
    "transfer",
    "unclear",
  ]),
});

const SCAN = 400;
const MAX = 100;

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

  await connectDB();
  const source = await Transaction.findById(parsed.data.sourceTransactionId).lean();
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const beneficiaryId = source.beneficiaryId.toString();
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const match = similarMatchFrom(source);
  if (!match) {
    return NextResponse.json({ updated: 0 });
  }

  const candidates = await Transaction.find({
    ...similarPrefilter(source),
    _id: { $ne: source._id },
    userCategory: { $ne: parsed.data.userCategory },
  })
    .select({ _id: 1, name: 1, merchantName: 1 })
    .limit(SCAN)
    .lean();

  const ids = candidates
    .filter((c) => rowMatchesSimilar(c, match))
    .slice(0, MAX)
    .map((c) => c._id);

  if (ids.length === 0) {
    return NextResponse.json({ updated: 0, match: match.label });
  }

  const res = await Transaction.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        userCategory: parsed.data.userCategory,
        lastUserEditedAt: new Date(),
      },
    },
  );

  await logActivity({
    userId: session.user.id,
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
    category: "transaction",
    action: "transaction.bulk_recategorized",
    resourceType: "transaction",
    resourceId: String(source._id),
    details: {
      to: parsed.data.userCategory,
      match: match.label,
      updated: res.modifiedCount ?? 0,
    },
  });

  return NextResponse.json({
    updated: res.modifiedCount ?? 0,
    match: match.label,
  });
}
