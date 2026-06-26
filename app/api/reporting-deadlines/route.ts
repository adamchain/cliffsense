import { auth } from "@/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";

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
  title: z.string().min(1).max(200),
  note: z.string().max(1000).optional(),
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
  const doc = await ReportingDeadline.create({
    beneficiaryId: new mongoose.Types.ObjectId(parsed.data.beneficiaryId),
    userId: new mongoose.Types.ObjectId(session.user.id),
    program: parsed.data.program ?? null,
    dueDate: new Date(`${parsed.data.dueDate}T00:00:00.000Z`),
    track: parsed.data.track ?? "scheduled",
    title: parsed.data.title,
    note: parsed.data.note ?? "",
  });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: parsed.data.beneficiaryId,
    category: "threshold",
    action: "reporting_deadline.created",
    resourceType: "reporting_deadline",
    resourceId: doc._id.toString(),
    details: { title: doc.title, dueDate: parsed.data.dueDate },
  });

  return NextResponse.json({ deadline: { _id: doc._id.toString() } });
}
