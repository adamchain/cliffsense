import { auth } from "@/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import { DEADLINE_KINDS } from "@/lib/calendar/deadline-kinds";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const rows = await ReportingDeadline.find({ beneficiaryId })
    .sort({ dueDate: 1 })
    .lean();
  const deadlines = rows.map((r) => ({
    _id: String(r._id),
    program: (r.program as string | null) ?? null,
    dueDate: (r.dueDate as Date).toISOString().slice(0, 10),
    track: r.track as string,
    kind: ((r as { kind?: string }).kind as string) ?? "deadline",
    sourceKey: ((r as { sourceKey?: string | null }).sourceKey as string | null) ?? null,
    title: r.title as string,
    note: (r.note as string) ?? "",
    completedAt: r.completedAt ? (r.completedAt as Date).toISOString() : null,
  }));
  return NextResponse.json({ deadlines });
}

const postSchema = z.object({
  beneficiaryId: z.string().min(1),
  program: z.string().max(20).optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  track: z.enum(["scheduled", "event"]).optional(),
  kind: z.enum(DEADLINE_KINDS).optional(),
  title: z.string().min(1).max(200),
  note: z.string().max(1000).optional(),
  continuedBenefitsDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, parsed.data.beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const beneficiaryId = new mongoose.Types.ObjectId(parsed.data.beneficiaryId);
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const doc = await ReportingDeadline.create({
    beneficiaryId,
    userId,
    program: parsed.data.program ?? null,
    dueDate: new Date(`${parsed.data.dueDate}T00:00:00.000Z`),
    track: parsed.data.track ?? "scheduled",
    kind: parsed.data.kind ?? "deadline",
    title: parsed.data.title,
    note: parsed.data.note ?? "",
  });

  let continuedId: string | null = null;
  if (parsed.data.kind === "appeal" && parsed.data.continuedBenefitsDate) {
    const continued = await ReportingDeadline.create({
      beneficiaryId,
      userId,
      program: parsed.data.program ?? null,
      dueDate: new Date(`${parsed.data.continuedBenefitsDate}T00:00:00.000Z`),
      track: "event",
      kind: "continued_benefits",
      title: "Request continued benefits",
      note: "Often earlier than the appeal deadline. Use the date on the adverse notice.",
    });
    continuedId = continued._id.toString();
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId: parsed.data.beneficiaryId,
    category: "threshold",
    action: "reporting_deadline.created",
    resourceType: "reporting_deadline",
    resourceId: doc._id.toString(),
    details: { title: doc.title, dueDate: parsed.data.dueDate, continuedId },
  });

  return NextResponse.json({ deadline: { _id: doc._id.toString(), continuedId } });
}
