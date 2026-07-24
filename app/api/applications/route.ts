import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Application, { APPLICATION_RELATIONSHIPS } from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { serializeApplication } from "@/lib/applications/serialize";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

const schema = z.object({
  personName: z.string().trim().min(1).max(160),
  relationship: z.enum(APPLICATION_RELATIONSHIPS),
});

/** Applicant fetches their own application (status, timeline, documents). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const app = await Application.findOne({ userId: session.user.id });
  if (!app) return NextResponse.json({ application: null });
  const docs = await ApplicationDocument.find({ applicationId: app._id })
    .select("-content")
    .sort({ createdAt: -1 });
  return NextResponse.json({ application: serializeApplication(app, docs) });
}

/** Applicant saves who they're acting for and marks the application submitted. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await connectDB();
  const app = await Application.findOne({ userId: session.user.id });
  if (!app) {
    return NextResponse.json({ error: "No application for this account" }, { status: 404 });
  }
  const firstSubmit = !app.submittedAt;
  app.actingFor = { personName: parsed.data.personName, relationship: parsed.data.relationship };
  if (firstSubmit) {
    app.submittedAt = new Date();
    app.timeline.push({ type: "submitted", at: new Date(), note: "Applicant details submitted." });
  }
  await app.save();

  await logActivity({
    userId: session.user.id,
    category: "auth",
    action: "application.submitted",
    resourceType: "application",
    resourceId: app._id.toString(),
    details: { relationship: parsed.data.relationship },
  });

  const docs = await ApplicationDocument.find({ applicationId: app._id })
    .select("-content")
    .sort({ createdAt: -1 });
  return NextResponse.json({ application: serializeApplication(app, docs) });
}
