import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Task from "@/lib/db/models/Task";
import { serializeTask } from "@/lib/tasks/serialize";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

const recurrenceSchema = z
  .object({
    freq: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).max(365).default(1),
    until: z.string().datetime().nullable().default(null),
  })
  .nullable()
  .default(null);

const createSchema = z.object({
  beneficiaryId: objectId,
  kind: z.enum(["task", "reminder"]).default("task"),
  title: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(4000).default(""),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  dueAt: z.string().datetime().nullable().default(null),
  allDay: z.boolean().default(true),
  recurrence: recurrenceSchema,
  linkedProgram: z.string().trim().max(60).default(""),
  remindViaEmail: z.boolean().default(false),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId") ?? "";
  if (!objectId.safeParse(beneficiaryId).success) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = searchParams.get("status");
  await connectDB();
  const filter: Record<string, unknown> = {
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
  };
  if (status && ["open", "done", "dismissed"].includes(status)) {
    filter.status = status;
  }

  // Open items sort by soonest due (nulls last); everything else by recency.
  const rows = await Task.find(filter)
    .sort({ status: 1, dueAt: 1, createdAt: -1 })
    .limit(500)
    .lean();
  return NextResponse.json({ tasks: rows.map((row) => serializeTask(row)) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a title and check the dates." }, { status: 400 });
  }
  const data = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, data.beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const doc = await Task.create({
    beneficiaryId: new mongoose.Types.ObjectId(data.beneficiaryId),
    createdByUserId: new mongoose.Types.ObjectId(session.user.id),
    kind: data.kind,
    title: data.title,
    notes: data.notes,
    priority: data.priority,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    allDay: data.allDay,
    recurrence: data.recurrence
      ? {
          freq: data.recurrence.freq,
          interval: data.recurrence.interval,
          until: data.recurrence.until ? new Date(data.recurrence.until) : null,
        }
      : null,
    linkedProgram: data.linkedProgram,
    remindViaEmail: data.remindViaEmail,
  });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: data.beneficiaryId,
    category: "task",
    action: "task.create",
    resourceType: "task",
    resourceId: doc._id.toString(),
    details: { kind: data.kind, recurring: Boolean(data.recurrence) },
  });
  return NextResponse.json({ task: serializeTask(doc) });
}
