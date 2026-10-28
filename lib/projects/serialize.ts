import type { ProjectDoc } from "@/lib/db/models/Project";

export type SerializedChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  dueAt: string | null;
};

export type SerializedProject = {
  id: string;
  name: string;
  description: string;
  status: "active" | "done" | "archived";
  color: string;
  checklist: SerializedChecklistItem[];
  notes: string;
  linkedDocumentIds: string[];
  openCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
};

type LeanProject = Partial<ProjectDoc> & { _id: { toString(): string } };

export function serializeProject(row: LeanProject): SerializedProject {
  const checklist = Array.isArray(row.checklist) ? row.checklist : [];
  const items: SerializedChecklistItem[] = checklist.map((c) => ({
    id: String(c.id),
    text: c.text ?? "",
    done: Boolean(c.done),
    dueAt: c.dueAt ? new Date(c.dueAt).toISOString() : null,
  }));
  return {
    id: row._id.toString(),
    name: row.name ?? "",
    description: row.description ?? "",
    status: (row.status as SerializedProject["status"]) ?? "active",
    color: row.color ?? "#3b82c4",
    checklist: items,
    notes: row.notes ?? "",
    linkedDocumentIds: Array.isArray(row.linkedDocumentIds)
      ? row.linkedDocumentIds.map((d) => d.toString())
      : [],
    openCount: items.filter((i) => !i.done).length,
    totalCount: items.length,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
  };
}
