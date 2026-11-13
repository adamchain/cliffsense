import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import { RECURRING_EXCLUSION_REASON, saveRecurringExclusionRule } from "@/lib/transactions/exclusion-rule";
import { recurringSeriesMatchFrom, rowMatchesRecurringSeries, similarPrefilter } from "@/lib/transactions/similar";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";

const bodySchema = z.object({
  sourceTransactionId: z.string().min(1),
  excludedFromThresholds: z.boolean(),
  excludedPrograms: z.array(z.string().max(40)).max(30).default([]),
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
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const beneficiaryId = source.beneficiaryId.toString();
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const match = recurringSeriesMatchFrom(source);
  if (!match) return NextResponse.json({ updated: 0 });

  const excluded = parsed.data.excludedFromThresholds;
  const excludedPrograms = [
    ...new Set(parsed.data.excludedPrograms.map((program) => program.trim()).filter(Boolean)),
  ];
  const candidates = await Transaction.find({
    ...similarPrefilter(source),
    _id: { $ne: source._id },
    amountCents: source.amountCents,
  })
    .select({ _id: 1, name: 1, merchantName: 1, amountCents: 1 })
    .limit(SCAN)
    .lean();
  const ids = candidates
    .filter((c) => rowMatchesRecurringSeries(c, match))
    .slice(0, MAX)
    .map((c) => c._id);

  const now = new Date();
  if (ids.length > 0) {
    await Transaction.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          excludedFromThresholds: excluded,
          excludedPrograms,
          excludeReason: excluded
            ? RECURRING_EXCLUSION_REASON
            : excludedPrograms.length
              ? `Left out of ${excludedPrograms.join(", ")}.`
              : "",
          lastUserEditedAt: now,
        },
      },
    );
  }

  await saveRecurringExclusionRule({
    beneficiaryId: source.beneficiaryId,
    userId: session.user.id,
    merchantName: match.label,
    amountCents: source.amountCents,
    userCategory: source.userCategory,
    excluded,
    excludedPrograms,
  });

  try {
    await evaluateThresholdsForBeneficiary({
      beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
      actorUserId: session.user.id,
    });
  } catch (error) {
    console.warn("evaluateThresholdsForBeneficiary after recurring exclusion", error);
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId: source.beneficiaryId,
    category: "transaction",
    action: excluded ? "transaction.series_excluded" : "transaction.series_included",
    resourceType: "transaction",
    resourceId: String(source._id),
    details: { match: match.label, amountCents: source.amountCents, updated: ids.length },
  });

  return NextResponse.json({ updated: ids.length, match: match.label, amountCents: source.amountCents });
}
