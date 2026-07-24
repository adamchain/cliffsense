import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import Application from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({
  reviewStatus: z.enum(["pending", "verified", "rejected"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, docId } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();
  const doc = await ApplicationDocument.findOne({ _id: docId, applicationId: id });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const app = await Application.findById(id).select("userId");

  doc.reviewStatus = parsed.data.reviewStatus;
  doc.reviewedByUserId = session.user.id as unknown as typeof doc.reviewedByUserId;
  doc.reviewedAt = new Date();
  await doc.save();

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action:
      parsed.data.reviewStatus === "rejected"
        ? "reject_application_document"
        : "verify_application_document",
    targetUserId: app ? String(app.userId) : null,
    details: { applicationId: id, documentId: docId, reviewStatus: parsed.data.reviewStatus },
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true, reviewStatus: doc.reviewStatus });
}
