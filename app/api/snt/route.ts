import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import SntDisbursement from "@/lib/db/models/SntDisbursement";
import VaultDocument from "@/lib/db/models/Document";
import { syncSntFollowUp } from "@/lib/snt/follow-up";
import { SNT_PAYMENT_STATUSES, SNT_REVIEW_STATUSES } from "@/lib/snt/record";
import { serializeSntDisbursement, serializeSntProfile } from "@/lib/snt/serialize";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

const profileSchema = z.object({
  beneficiaryId: objectId,
  trustName: z.string().trim().max(200),
  trusteeName: z.string().trim().max(200),
  trusteeContact: z.string().trim().max(300),
  financialInstitution: z.string().trim().max(200),
});

const createSchema = z.object({
  beneficiaryId: objectId,
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

async function proofBelongsToBeneficiary(beneficiaryId: string, documentIds: string[]): Promise<boolean> {
  if (documentIds.length === 0) return true;
  const unique = [...new Set(documentIds)];
  const count = await VaultDocument.countDocuments({
    beneficiaryId,
    _id: { $in: unique },
  });
  return count === unique.length;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const beneficiaryId = new URL(req.url).searchParams.get("beneficiaryId") ?? "";
  if (!objectId.safeParse(beneficiaryId).success) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const [ben, rows] = await Promise.all([
    Beneficiary.findById(beneficiaryId).select("sntProfile").lean(),
    SntDisbursement.find({ beneficiaryId }).sort({ paymentDate: -1, createdAt: -1 }).lean(),
  ]);
  return NextResponse.json({
    profile: serializeSntProfile(ben?.sntProfile),
    disbursements: rows.map((row) => serializeSntDisbursement(row)),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const ok = await assertBeneficiaryWriteAccess(session.user.id, parsed.data.beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const profile = {
    trustName: parsed.data.trustName,
    trusteeName: parsed.data.trusteeName,
    trusteeContact: parsed.data.trusteeContact,
    financialInstitution: parsed.data.financialInstitution,
  };
  const updated = await Beneficiary.findByIdAndUpdate(
    parsed.data.beneficiaryId,
    { $set: { sntProfile: profile } },
    { new: true },
  )
    .select("sntProfile")
    .lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: parsed.data.beneficiaryId,
    category: "vault",
    action: "snt_profile_update",
    resourceType: "beneficiary",
    resourceId: parsed.data.beneficiaryId,
  });
  return NextResponse.json({ profile: serializeSntProfile(updated.sntProfile) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Check the amount, payee, purpose, and dates." }, { status: 400 });
  const data = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, data.beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  if (!(await proofBelongsToBeneficiary(data.beneficiaryId, data.documentIds))) {
    return NextResponse.json({ error: "Supporting files must already be in this Vault." }, { status: 400 });
  }

  const beneficiaryId = new mongoose.Types.ObjectId(data.beneficiaryId);
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const doc = await SntDisbursement.create({
    beneficiaryId,
    userId,
    trustName: data.trustName,
    trusteeName: data.trusteeName,
    financialInstitution: data.financialInstitution,
    paymentDate: utcDate(data.paymentDate),
    amountCents: data.amountCents,
    payee: data.payee,
    purpose: data.purpose,
    status: data.status,
    reviewStatus: data.reviewStatus,
    proofNote: data.proofNote,
    documentIds: data.documentIds.map((id) => new mongoose.Types.ObjectId(id)),
    followUpDate: utcDate(data.followUpDate),
  });
  await syncSntFollowUp({
    beneficiaryId,
    userId,
    disbursementId: doc._id,
    payee: data.payee,
    purpose: data.purpose,
    followUpDate: data.followUpDate,
  });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: data.beneficiaryId,
    category: "vault",
    action: "snt_disbursement_create",
    resourceType: "snt_disbursement",
    resourceId: doc._id.toString(),
    details: { status: data.status, reviewStatus: data.reviewStatus },
  });
  return NextResponse.json({ disbursement: serializeSntDisbursement(doc) });
}
