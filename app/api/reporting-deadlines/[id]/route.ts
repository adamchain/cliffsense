import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import mongoose from "mongoose";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import DocumentModel from "@/lib/db/models/Document";
import { DATE_CONFIDENCES } from "@/lib/reporting/obligations";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/**
 * Every field is optional so the calendar can update one stage at a time.
 * Changes apply to this obligation only — never to a related renewal or report.
 */
const patchSchema = z
  .object({
    completed: z.boolean().optional(),
    prepared: z.boolean().optional(),
    submitted: z.boolean().optional(),
    acknowledged: z.boolean().optional(),
    proofDocumentId: objectId.nullable().optional(),
    sourceDocumentId: objectId.nullable().optional(),
    followUp: z.string().max(1000).optional(),
    confidence: z.enum(DATE_CONFIDENCES).optional(),
    sourceNote: z.string().max(500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

function stamp(on: boolean, current: Date | null | undefined): Date | null {
  if (!on) return null;
  return current ?? new Date();
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();
  const row = await ReportingDeadline.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = parsed.data;
  // Linked notices and proofs must be this beneficiary's own Vault documents.
  for (const docId of [p.proofDocumentId, p.sourceDocumentId]) {
    if (!docId) continue;
    const owned = await DocumentModel.exists({ _id: docId, beneficiaryId: row.beneficiaryId });
    if (!owned) {
      return NextResponse.json({ error: "Document not found" }, { status: 400 });
    }
  }
  if (p.completed !== undefined) row.completedAt = stamp(p.completed, row.completedAt);
  if (p.prepared !== undefined) row.preparedAt = stamp(p.prepared, row.preparedAt);
  if (p.submitted !== undefined) row.submittedAt = stamp(p.submitted, row.submittedAt);
  if (p.acknowledged !== undefined) row.acknowledgedAt = stamp(p.acknowledged, row.acknowledgedAt);
  if (p.proofDocumentId !== undefined) {
    row.proofDocumentId = p.proofDocumentId ? new mongoose.Types.ObjectId(p.proofDocumentId) : null;
  }
  if (p.sourceDocumentId !== undefined) {
    row.sourceDocumentId = p.sourceDocumentId
      ? new mongoose.Types.ObjectId(p.sourceDocumentId)
      : null;
  }
  if (p.followUp !== undefined) row.followUp = p.followUp;
  if (p.confidence !== undefined) row.confidence = p.confidence;
  if (p.sourceNote !== undefined) row.sourceNote = p.sourceNote;
  await row.save();
  return NextResponse.json({
    deadline: {
      _id: row._id.toString(),
      completedAt: row.completedAt,
      preparedAt: row.preparedAt,
      submittedAt: row.submittedAt,
      proofDocumentId: row.proofDocumentId ? String(row.proofDocumentId) : null,
      acknowledgedAt: row.acknowledgedAt,
      followUp: row.followUp,
      confidence: row.confidence,
      sourceNote: row.sourceNote,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  await connectDB();
  const row = await ReportingDeadline.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await row.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId,
    category: "threshold",
    action: "reporting_deadline.deleted",
    resourceType: "reporting_deadline",
    resourceId: id,
  });
  return NextResponse.json({ ok: true });
}
