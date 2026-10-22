import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import SntDisbursement from "@/lib/db/models/SntDisbursement";
import VaultDocument from "@/lib/db/models/Document";
import { removeSntFollowUp, syncSntFollowUp } from "@/lib/snt/follow-up";
import { SNT_PAYMENT_STATUSES, SNT_REVIEW_STATUSES } from "@/lib/snt/record";
import { serializeSntDisbursement } from "@/lib/snt/serialize";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

const patchSchema = z.object({
  trustName: z.string().trim().max(200),
  trusteeName: z.string().trim().max(200),
  financialInstitution: z.string().trim().max(200),
  paymentDate: dateField,
  amountCents: z.number().int().min(0).max(1_000_000_000),
  payee: z.string().trim().min(1).max(200),
  purpose: z.string().trim().min(1).max(500),
  status: z.enum(SNT_PAYMENT_STATUSES),
  reviewStatus: z.enum(SNT_REVIEW_STATUSES),
  proofNote: z.string().trim().max(1000),
  documentIds: z.array(objectId).max(20),
  followUpDate: dateField,
});

function utcDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the amount, payee, purpose, and dates." }, { status: 400 });
  }

  await connectDB();
  const existing = await SntDisbursement.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const beneficiaryId = existing.beneficiaryId.toString();
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const uniqueDocs = [...new Set(parsed.data.documentIds)];
  if (uniqueDocs.length > 0) {
    const count = await VaultDocument.countDocuments({
      beneficiaryId: existing.beneficiaryId,
      _id: { $in: uniqueDocs },
    });
    if (count !== uniqueDocs.length) {
      return NextResponse.json({ error: "Supporting files must already be in this Vault." }, { status: 400 });
    }
  }

  existing.trustName = parsed.data.trustName;
  existing.trusteeName = parsed.data.trusteeName;
  existing.financialInstitution = parsed.data.financialInstitution;
  existing.paymentDate = utcDate(parsed.data.paymentDate);
  existing.amountCents = parsed.data.amountCents;
  existing.payee = parsed.data.payee;
  existing.purpose = parsed.data.purpose;
  existing.status = parsed.data.status;
  existing.reviewStatus = parsed.data.reviewStatus;
  existing.proofNote = parsed.data.proofNote;
  existing.documentIds = uniqueDocs.map((docId) => new mongoose.Types.ObjectId(docId));
  existing.followUpDate = utcDate(parsed.data.followUpDate);
  await existing.save();
  await syncSntFollowUp({
    beneficiaryId: existing.beneficiaryId,
    userId: new mongoose.Types.ObjectId(session.user.id),
    disbursementId: existing._id,
    payee: parsed.data.payee,
    purpose: parsed.data.purpose,
    followUpDate: parsed.data.followUpDate,
  });
  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "vault",
    action: "snt_disbursement_update",
    resourceType: "snt_disbursement",
    resourceId: id,
    details: { status: parsed.data.status, reviewStatus: parsed.data.reviewStatus },
  });
  return NextResponse.json({ disbursement: serializeSntDisbursement(existing) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const existing = await SntDisbursement.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const beneficiaryId = existing.beneficiaryId.toString();
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await removeSntFollowUp(existing.beneficiaryId, existing._id);
  await existing.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "vault",
    action: "snt_disbursement_delete",
    resourceType: "snt_disbursement",
    resourceId: id,
  });
  return NextResponse.json({ ok: true });
}
