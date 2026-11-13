import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import { reapplyAutoCategoriesForBeneficiary } from "@/lib/transactions/reapply-auto-categories";
import { syncAutoIrweFromExpenses } from "@/lib/transactions/sync-auto-irwe";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";

const bodySchema = z.object({ beneficiaryId: z.string().min(1) }).strict();

/**
 * Bulk-apply category heuristics to unedited unclear / mis-tagged rows.
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
  const beneficiaryObjectId = new mongoose.Types.ObjectId(beneficiaryId);
  const result = await reapplyAutoCategoriesForBeneficiary(beneficiaryObjectId);
  const irwe = await syncAutoIrweFromExpenses(beneficiaryObjectId);

  if (result.updated > 0 || irwe.changed) {
    try {
      await evaluateThresholdsForBeneficiary({
        beneficiaryId: beneficiaryObjectId,
        actorUserId: session.user.id,
      });
    } catch (e) {
      console.warn("evaluateThresholdsForBeneficiary after category apply", e);
    }
  }

  return NextResponse.json({
    ...result,
    irweMonthlyCents: irwe.monthlyCents,
    irweChanged: irwe.changed,
  });
}
