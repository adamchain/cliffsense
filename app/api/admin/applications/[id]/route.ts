import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Application from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";
import { canApprove } from "@/lib/applications/review";
import {
  sendApplicationApprovedEmail,
  sendApplicationInfoRequestedEmail,
  sendApplicationRejectedEmail,
} from "@/lib/applications/emails";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject", "request_info"]),
  note: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { action, note } = parsed.data;

  await connectDB();
  const app = await Application.findById(id);
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  const applicant = await User.findById(app.userId).select("email").lean();
  const email = applicant?.email ?? "";
  const meta = clientMeta(req);
  const actorId = session.user.id;
  const now = new Date();

  if (action === "approve") {
    const docs = await ApplicationDocument.find({ applicationId: app._id }).select("reviewStatus");
    if (!canApprove(docs)) {
      return NextResponse.json(
        { error: "At least one document must be verified before approving." },
        { status: 400 },
      );
    }
    app.status = "approved";
    app.reviewedByUserId = actorId as unknown as typeof app.reviewedByUserId;
    app.reviewedAt = now;
    app.reviewNote = note ?? "";
    app.timeline.push({ type: "approved", at: now, note: note ?? "" });
    await app.save();
    await User.updateOne({ _id: app.userId }, { $set: { applicationStatus: "approved" } });
    await logAdminAction({
      actorUserId: actorId,
      actorEmail: session.user.email,
      action: "approve_application",
      targetUserId: String(app.userId),
      targetEmail: email,
      details: { applicationId: String(app._id) },
      ...meta,
    });
    if (email) {
      try {
        await sendApplicationApprovedEmail({ to: email, statusToken: app.statusToken });
      } catch (e) {
        console.warn("approved email failed", e);
      }
    }
    return NextResponse.json({ ok: true, status: app.status });
  }

  if (action === "reject") {
    app.status = "rejected";
    app.reviewedByUserId = actorId as unknown as typeof app.reviewedByUserId;
    app.reviewedAt = now;
    app.reviewNote = note ?? "";
    app.timeline.push({ type: "rejected", at: now, note: note ?? "" });
    await app.save();
    await User.updateOne({ _id: app.userId }, { $set: { applicationStatus: "rejected" } });
    await logAdminAction({
      actorUserId: actorId,
      actorEmail: session.user.email,
      action: "reject_application",
      targetUserId: String(app.userId),
      targetEmail: email,
      details: { applicationId: String(app._id) },
      ...meta,
    });
    if (email) {
      try {
        await sendApplicationRejectedEmail({ to: email, statusToken: app.statusToken, reason: note });
      } catch (e) {
        console.warn("rejected email failed", e);
      }
    }
    return NextResponse.json({ ok: true, status: app.status });
  }

  // request_info — stays pending, applicant keeps access to /application.
  app.reviewNote = note ?? "";
  app.timeline.push({ type: "info_requested", at: now, note: note ?? "" });
  await app.save();
  await logAdminAction({
    actorUserId: actorId,
    actorEmail: session.user.email,
    action: "request_application_info",
    targetUserId: String(app.userId),
    targetEmail: email,
    details: { applicationId: String(app._id) },
    ...meta,
  });
  if (email) {
    try {
      await sendApplicationInfoRequestedEmail({ to: email, statusToken: app.statusToken, note });
    } catch (e) {
      console.warn("info-requested email failed", e);
    }
  }
  return NextResponse.json({ ok: true, status: app.status });
}
