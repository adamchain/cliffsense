import type { TaskDoc } from "@/lib/db/models/Task";

export type SerializedTask = {
  id: string;
  kind: "task" | "reminder";
  title: string;
  notes: string;
  priority: "low" | "normal" | "high";
  status: "open" | "done" | "dismissed";
  dueAt: string | null;
  allDay: boolean;
  recurrence: { freq: string; interval: number; until: string | null } | null;
  linkedProgram: string;
  remindViaEmail: boolean;
  completedAt: string | null;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
};

type LeanTask = Partial<TaskDoc> & { _id: { toString(): string } };

export function serializeTask(row: LeanTask): SerializedTask {
  const rec = row.recurrence as
    | { freq: string; interval: number; until: Date | null }
    | null
    | undefined;
  return {
    id: row._id.toString(),
    kind: (row.kind as "task" | "reminder") ?? "task",
    title: row.title ?? "",
    notes: row.notes ?? "",
    priority: (row.priority as SerializedTask["priority"]) ?? "normal",
    status: (row.status as SerializedTask["status"]) ?? "open",
    dueAt: row.dueAt ? new Date(row.dueAt).toISOString() : null,
    allDay: row.allDay ?? true,
    recurrence: rec
      ? {
          freq: rec.freq,
          interval: rec.interval ?? 1,
          until: rec.until ? new Date(rec.until).toISOString() : null,
        }
      : null,
    linkedProgram: row.linkedProgram ?? "",
    remindViaEmail: row.remindViaEmail ?? false,
    completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    completedCount: row.completedCount ?? 0,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
  };
}
