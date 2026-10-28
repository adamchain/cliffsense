import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Task from "@/lib/db/models/Task";
import { nextOccurrence } from "@/lib/tasks/recurrence";
import { serializeTask } from "@/lib/tasks/serialize";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

const recurrenceSchema = z
  .object({
    freq: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).max(365).default(1),
    until: z.string().datetime().nullable().default(null),
  })
  .nullable();

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  notes: z.string().trim().max(4000).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  status: z.enum(["open", "done", "dismissed"]).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  recurrence: recurrenceSchema.optional(),
  linkedProgram: z.string().trim().max(60).optional(),
  remindViaEmail: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, task.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = parsed.data;

  // Completing a recurring item rolls it forward to the next occurrence rather
  // than closing it — unless the series has run past its `until` date.
  if (data.status === "done" && task.status !== "done" && task.recurrence && task.dueAt) {
    const next = nextOccurrence(task.dueAt, {
      freq: task.recurrence.freq,
      interval: task.recurrence.interval ?? 1,
      until: task.recurrence.until ?? null,
    });
    task.completedCount = (task.completedCount ?? 0) + 1;
    if (next) {
      task.dueAt = next;
      task.lastNotifiedAt = null;
      // stays "open" as the next occurrence
    } else {
      task.status = "done";
      task.completedAt = new Date();
    }
  } else if (data.status) {
    task.status = data.status;
    task.completedAt = data.status === "done" ? new Date() : null;
  }

  if (data.title !== undefined) task.title = data.title;
  if (data.notes !== undefined) task.notes = data.notes;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.dueAt !== undefined) task.dueAt = data.dueAt ? new Date(data.dueAt) : null;
  if (data.allDay !== undefined) task.allDay = data.allDay;
  if (data.recurrence !== undefined) {
    task.recurrence = data.recurrence
      ? {
          freq: data.recurrence.freq,
          interval: data.recurrence.interval,
          until: data.recurrence.until ? new Date(data.recurrence.until) : null,
        }
      : null;
  }
  if (data.linkedProgram !== undefined) task.linkedProgram = data.linkedProgram;
  if (data.remindViaEmail !== undefined) task.remindViaEmail = data.remindViaEmail;

  await task.save();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: task.beneficiaryId.toString(),
    category: "task",
    action: "task.update",
    resourceType: "task",
    resourceId: task._id.toString(),
    details: { status: task.status },
  });
  return NextResponse.json({ task: serializeTask(task) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, task.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await task.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: task.beneficiaryId.toString(),
    category: "task",
    action: "task.delete",
    resourceType: "task",
    resourceId: id,
  });
  return NextResponse.json({ ok: true });
}
