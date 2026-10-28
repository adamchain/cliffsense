"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCircle,
  IconCircleCheckFilled,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type { SerializedChecklistItem, SerializedProject } from "@/lib/projects/serialize";

type Status = "active" | "done" | "archived";

let itemSeq = 0;
function newItemId(): string {
  itemSeq += 1;
  return `i${Date.now().toString(36)}${itemSeq}`;
}

export function ProjectDetail({ projectId, canWrite }: { projectId: string; canWrite: boolean }) {
  const [project, setProject] = useState<SerializedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState("");
  const [newItem, setNewItem] = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setProject(data.project);
      setNotes(data.project?.notes ?? "");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    },
    [projectId],
  );

  const saveChecklist = useCallback(
    (items: SerializedChecklistItem[]) => {
      setProject((p) => (p ? { ...p, checklist: items } : p));
      void patch({ checklist: items.map((i) => ({ id: i.id, text: i.text, done: i.done, dueAt: i.dueAt })) });
    },
    [patch],
  );

  function addItem() {
    if (!project || !newItem.trim()) return;
    const items = [
      ...project.checklist,
      { id: newItemId(), text: newItem.trim(), done: false, dueAt: null },
    ];
    setNewItem("");
    saveChecklist(items);
  }

  function toggleItem(id: string) {
    if (!project) return;
    saveChecklist(project.checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function removeItem(id: string) {
    if (!project) return;
    saveChecklist(project.checklist.filter((i) => i.id !== id));
  }

  function onNotesChange(value: string) {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => void patch({ notes: value }), 700);
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">Loading…</p>;
  }
  if (notFound || !project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
        Project not found.{" "}
        <Link href="/projects" className="text-[var(--color-cs-brand)] hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const done = project.checklist.filter((i) => i.done).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Link
        href="/projects"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
      >
        <IconArrowLeft size={15} aria-hidden /> All projects
      </Link>

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          <div>
            {canWrite ? (
              <input
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                onBlur={(e) => void patch({ name: e.target.value.trim() || project.name })}
                className="w-full rounded-md border border-transparent bg-transparent text-[20px] font-bold text-[var(--color-cs-text)] outline-none hover:border-[var(--color-cs-sep)] focus:border-[var(--color-cs-brand)]"
              />
            ) : (
              <h1 className="text-[20px] font-bold text-[var(--color-cs-text)]">{project.name}</h1>
            )}
          </div>
        </div>
        {canWrite && (
          <select
            value={project.status}
            onChange={(e) => void patch({ status: e.target.value as Status })}
            className="rounded-full border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-cs-text)]"
          >
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
        )}
      </header>

      {/* Description */}
      <section className="mb-4 rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {canWrite ? (
          <textarea
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            onBlur={(e) => void patch({ description: e.target.value.trim() })}
            placeholder="Describe this project…"
            rows={2}
            className="w-full resize-none bg-transparent text-[13.5px] text-[var(--color-cs-text)] outline-none placeholder:text-[var(--color-cs-text-muted)]"
          />
        ) : (
          <p className="text-[13.5px] text-[var(--color-cs-text-secondary)]">
            {project.description || "No description."}
          </p>
        )}
      </section>

      {/* Checklist */}
      <section className="mb-4 rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[var(--color-cs-text)]">Checklist</h2>
          <span className="text-[12px] text-[var(--color-cs-text-muted)]">
            {done}/{project.checklist.length} done
          </span>
        </div>
        <ul className="flex flex-col gap-1">
          {project.checklist.map((item) => (
            <li key={item.id} className="group flex items-center gap-2.5 rounded-[10px] px-1 py-1 hover:bg-[var(--color-cs-surface)]">
              <button
                type="button"
                onClick={() => canWrite && toggleItem(item.id)}
                disabled={!canWrite}
                aria-label={item.done ? "Mark not done" : "Mark done"}
                className="shrink-0 text-[var(--color-cs-brand)]"
              >
                {item.done ? (
                  <IconCircleCheckFilled size={19} aria-hidden />
                ) : (
                  <IconCircle size={19} stroke={1.8} className="text-[var(--color-cs-text-muted)]" aria-hidden />
                )}
              </button>
              <span
                className={`flex-1 text-[13.5px] ${
                  item.done ? "text-[var(--color-cs-text-muted)] line-through" : "text-[var(--color-cs-text)]"
                }`}
              >
                {item.text}
              </span>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="Delete item"
                  className="shrink-0 p-1 text-[var(--color-cs-text-muted)] opacity-0 transition hover:text-[#c0392b] group-hover:opacity-100"
                >
                  <IconTrash size={14} aria-hidden />
                </button>
              )}
            </li>
          ))}
          {project.checklist.length === 0 && (
            <li className="px-1 py-2 text-[12.5px] text-[var(--color-cs-text-muted)]">No items yet.</li>
          )}
        </ul>
        {canWrite && (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Add a step and press Enter"
              className="flex-1 rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]"
            />
            <button
              type="button"
              onClick={addItem}
              aria-label="Add item"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
            >
              <IconPlus size={17} stroke={2} aria-hidden />
            </button>
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h2 className="mb-2 text-[14px] font-bold text-[var(--color-cs-text)]">Notes</h2>
        {canWrite ? (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Running notes, contacts, order numbers, next steps…"
            rows={6}
            className="w-full resize-y rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] leading-relaxed text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[13px] text-[var(--color-cs-text-secondary)]">
            {project.notes || "No notes."}
          </p>
        )}
      </section>
    </div>
  );
}
