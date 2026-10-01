import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { applyCaseAction, type CaseAction } from "@/lib/alerts/case-workflow";
import { serializeContinuityCase, workflowFromCase } from "@/lib/alerts/serialize-case";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import ContinuityCase from "@/lib/db/models/ContinuityCase";
import VaultDocument from "@/lib/db/models/Document";

const patchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("link_evidence"),
    slotKey: z.string().min(1),
    documentId: z.string().min(1).nullable(),
  }),
  z.object({
    type: z.literal("record_submission"),
    method: z.string().min(1).max(80),
    submittedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    documentId: z.string().min(1),
    note: z.string().max(1000).optional(),
  }),
  z.object({
    type: z.literal("record_acknowledgment"),
    note: z.string().max(1000).optional(),
  }),
  z.object({
    type: z.literal("set_appeal"),
    appealDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    continuedBenefitsDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  }),
]);

async function documentOnCase(beneficiaryId: unknown, documentId: string | null): Promise<boolean> {
  if (!documentId) return true;
  const doc = await VaultDocument.findOne({ _id: documentId, beneficiaryId }).select("_id").lean();
  return Boolean(doc);
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
  const opened = await ContinuityCase.findById(id);
  if (!opened) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const beneficiaryId = opened.beneficiaryId.toString();
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documentId =
    parsed.data.type === "link_evidence"
      ? parsed.data.documentId
      : parsed.data.type === "record_submission"
        ? parsed.data.documentId
        : null;
  if (documentId && !(await documentOnCase(opened.beneficiaryId, documentId))) {
    return NextResponse.json({ error: "That file is not in this Vault." }, { status: 400 });
  }

  const action: CaseAction =
    parsed.data.type === "record_acknowledgment"
      ? { type: "record_acknowledgment", note: parsed.data.note ?? "", recordedAt: new Date().toISOString() }
      : parsed.data.type === "record_submission"
        ? { ...parsed.data, note: parsed.data.note ?? "" }
        : parsed.data;

  const result = applyCaseAction(workflowFromCase(serializeContinuityCase(opened.toObject())), action);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  opened.status = result.state.status;
  opened.parts = result.state.parts;
  opened.evidence = result.state.evidence;
  opened.tasks = result.state.tasks;
  opened.submission = result.state.submission;
  opened.acknowledgment = result.state.acknowledgment;
  opened.followUp = result.state.followUp;
  opened.markModified("parts");
  opened.markModified("evidence");
  opened.markModified("tasks");
  opened.markModified("submission");
  opened.markModified("acknowledgment");
  opened.markModified("followUp");
  await opened.save();

  await Alert.updateOne({ _id: opened.alertId }, { $set: { parts: result.state.parts } });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: opened.beneficiaryId,
    category: "alert",
    action: `case.${parsed.data.type}`,
    resourceType: "continuityCase",
    resourceId: opened._id.toString(),
    details: { alertId: opened.alertId.toString(), status: result.state.status },
  });

  return NextResponse.json({ continuityCase: serializeContinuityCase(opened.toObject()) });
}
