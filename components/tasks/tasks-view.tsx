"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconBell,
  IconCalendarRepeat,
  IconChecklist,
  IconCircle,
  IconCircleCheckFilled,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { SerializedTask } from "@/lib/tasks/serialize";

type Filter = "open" | "done" | "all";
type Kind = "task" | "reminder";
type Freq = "daily" | "weekly" | "monthly" | "yearly";

const FREQ_LABEL: Record<Freq, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

type FormState = {
  id: string | null;
  kind: Kind;
  title: string;
  notes: string;
  priority: "low" | "normal" | "high";
  dueLocal: string; // value for <input type="datetime-local">
  allDay: boolean;
  repeats: boolean;
  freq: Freq;
  interval: number;
  untilLocal: string; // <input type="date">
  linkedProgram: string;
  remindViaEmail: boolean;
};

function emptyForm(kind: Kind = "task"): FormState {
  return {
    id: null,
    kind,
    title: "",
    notes: "",
    priority: "normal",
    dueLocal: "",
    allDay: true,
    repeats: false,
    freq: "monthly",
    interval: 1,
    untilLocal: "",
    linkedProgram: "",
    remindViaEmail: false,
  };
}

/** ISO string from a datetime-local or date value entered in the user's zone. */
function localToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → value for <input type="datetime-local"> in the user's local zone. */
function isoToLocalInput(iso: string | null, dateOnly = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? base : `${base}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formToPayload(f: FormState) {
  const dueAt = localToIso(f.dueLocal);
  return {
    kind: f.kind,
    title: f.title.trim(),
    notes: f.notes.trim(),
    priority: f.priority,
    dueAt,
    allDay: f.allDay,
    recurrence:
      f.repeats && dueAt
        ? { freq: f.freq, interval: Math.max(1, f.interval || 1), until: localToIso(f.untilLocal) }
        : null,
    linkedProgram: f.linkedProgram,
    remindViaEmail: f.remindViaEmail,
  };
}

function dueBucket(iso: string | null): "overdue" | "today" | "upcoming" | "none" {
  if (!iso) return "none";
  const d = new Date(iso);
  const now = new Date();
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (d.getTime() < now.getTime() - 60_000 && d.getTime() < endToday.getTime() && d < startOfToday(now))
    return "overdue";
  if (d.getTime() < startOfToday(now).getTime()) return "overdue";
  if (d.getTime() <= endToday.getTime()) return "today";
  return "upcoming";
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDue(iso: string | null, allDay: boolean): string {
  if (!iso) return "No date";
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (allDay) return dateStr;
  return `${dateStr} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function recurrenceLabel(rec: SerializedTask["recurrence"]): string | null {
  if (!rec) return null;
  const unit = FREQ_LABEL[rec.freq as Freq] ?? rec.freq;
  return rec.interval > 1 ? `Every ${rec.interval} ${unit}s` : `Every ${unit}`;
}

const BUCKET_TITLES: Record<string, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  none: "No date",
};

export function TasksView({
  beneficiaryId,
  programs,
}: {
  beneficiaryId: string | null;
  programs: string[];
}) {
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("open");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!beneficiaryId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({ beneficiaryId });
    if (filter !== "all") qs.set("status", filter);
    try {
      const res = await fetch(`/api/tasks?${qs.toString()}`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (!beneficiaryId || !form) return;
    const payload = formToPayload(form);
    if (!payload.title) {
      setError("Give it a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = form.id
        ? await fetch(`/api/tasks/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ beneficiaryId, ...payload }),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save.");
        return;
      }
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  }, [beneficiaryId, form, load]);

  const toggleDone = useCallback(
    async (t: SerializedTask) => {
      const next = t.status === "done" ? "open" : "done";
      // optimistic
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
      await fetch(`/api/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (t: SerializedTask) => {
      if (!window.confirm(`Delete "${t.title}"?`)) return;
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
      await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  const startEdit = useCallback((t: SerializedTask) => {
    setError(null);
    setForm({
      id: t.id,
      kind: t.kind,
      title: t.title,
      notes: t.notes,
      priority: t.priority,
      dueLocal: isoToLocalInput(t.dueAt, t.allDay),
      allDay: t.allDay,
      repeats: Boolean(t.recurrence),
      freq: (t.recurrence?.freq as Freq) ?? "monthly",
      interval: t.recurrence?.interval ?? 1,
      untilLocal: isoToLocalInput(t.recurrence?.until ?? null, true),
      linkedProgram: t.linkedProgram,
      remindViaEmail: t.remindViaEmail,
    });
  }, []);

  const grouped = useMemo(() => {
    if (filter === "done") return [{ key: "done", title: "Completed", items: tasks }];
    const buckets: Record<string, SerializedTask[]> = { overdue: [], today: [], upcoming: [], none: [] };
    for (const t of tasks) {
      if (t.status === "done") continue;
      buckets[dueBucket(t.dueAt)].push(t);
    }
    return (["overdue", "today", "upcoming", "none"] as const)
      .filter((k) => buckets[k].length > 0)
      .map((k) => ({ key: k, title: BUCKET_TITLES[k], items: buckets[k] }));
  }, [tasks, filter]);

  if (!beneficiaryId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile to start tracking tasks and reminders.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-bold text-[var(--color-cs-text)]">
            <IconChecklist size={22} stroke={1.8} aria-hidden />
            Tasks &amp; reminders
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">
            One-time or recurring to-dos and reminders for this person.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setForm(emptyForm());
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          <IconPlus size={16} stroke={2} aria-hidden />
          New
        </button>
      </header>

      <div className="mb-4 inline-flex rounded-full bg-[var(--color-cs-surface)] p-0.5 text-[12.5px]">
        {(["open", "done", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 font-medium capitalize transition ${
              filter === f
                ? "bg-[var(--color-cs-card)] text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
          >
            {f === "open" ? "To do" : f}
          </button>
        ))}
      </div>

      {form && (
        <TaskForm
          form={form}
          setForm={setForm}
          onSave={save}
          onCancel={() => setForm(null)}
          saving={saving}
          error={error}
          programs={programs}
        />
      )}

      {loading ? (
        <p className="py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-[16px] bg-[var(--color-cs-card)] px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          {filter === "done" ? "Nothing completed yet." : "No tasks yet. Add your first one."}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map((g) => (
            <section key={g.key}>
              <h2
                className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                  g.key === "overdue" ? "text-[#c0392b]" : "text-[var(--color-cs-text-muted)]"
                }`}
              >
                {g.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {g.items.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={() => toggleDone(t)}
                    onEdit={() => startEdit(t)}
                    onDelete={() => remove(t)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: SerializedTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";
  const rec = recurrenceLabel(task.recurrence);
  const overdue = !done && dueBucket(task.dueAt) === "overdue";
  return (
    <li className="group flex items-start gap-3 rounded-[14px] bg-[var(--color-cs-card)] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className="mt-0.5 shrink-0 text-[var(--color-cs-brand)]"
      >
        {done ? (
          <IconCircleCheckFilled size={20} aria-hidden />
        ) : (
          <IconCircle size={20} stroke={1.8} className="text-[var(--color-cs-text-muted)]" aria-hidden />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {task.priority === "high" && !done && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#e67e22]" aria-label="High priority" />
          )}
          <span
            className={`truncate text-[13.5px] font-medium ${
              done ? "text-[var(--color-cs-text-muted)] line-through" : "text-[var(--color-cs-text)]"
            }`}
          >
            {task.title}
          </span>
        </div>
        {task.notes && (
          <p className="mt-0.5 truncate text-[12px] text-[var(--color-cs-text-secondary)]">{task.notes}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px]">
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? "font-semibold text-[#c0392b]" : "text-[var(--color-cs-text-muted)]"
            }`}
          >
            {task.kind === "reminder" ? <IconBell size={13} aria-hidden /> : null}
            {formatDue(task.dueAt, task.allDay)}
          </span>
          {rec && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-cs-surface)] px-2 py-0.5 text-[var(--color-cs-text-secondary)]">
              <IconCalendarRepeat size={12} aria-hidden />
              {rec}
            </span>
          )}
          {task.linkedProgram && (
            <span className="rounded-full bg-[var(--color-cs-surface)] px-2 py-0.5 text-[var(--color-cs-text-secondary)]">
              {task.linkedProgram}
            </span>
          )}
          {task.remindViaEmail && (
            <span className="text-[var(--color-cs-text-muted)]">Email</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          className="rounded-lg p-1.5 text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-surface)]"
        >
          <IconPencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="rounded-lg p-1.5 text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-surface)] hover:text-[#c0392b]"
        >
          <IconTrash size={15} aria-hidden />
        </button>
      </div>
    </li>
  );
}

function TaskForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
  programs,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  programs: string[];
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const inputCls =
    "w-full rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]";

  return (
    <div className="mb-4 rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex rounded-full bg-[var(--color-cs-surface)] p-0.5 text-[12px]">
          {(["task", "reminder"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set("kind", k)}
              className={`rounded-full px-3 py-1 font-medium capitalize ${
                form.kind === k
                  ? "bg-[var(--color-cs-card)] text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[var(--color-cs-text-secondary)]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-[var(--color-cs-text-muted)]">
          <IconX size={18} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          autoFocus
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={form.kind === "reminder" ? "Remind me to…" : "What needs doing?"}
          className={inputCls}
        />
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className={inputCls}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11.5px] font-medium text-[var(--color-cs-text-secondary)]">
            Due
            <input
              type={form.allDay ? "date" : "datetime-local"}
              value={form.allDay ? form.dueLocal.slice(0, 10) : form.dueLocal}
              onChange={(e) => set("dueLocal", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] font-medium text-[var(--color-cs-text-secondary)]">
            Priority
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as FormState["priority"])}
              className={inputCls}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-[12.5px] text-[var(--color-cs-text-secondary)]">
          <input type="checkbox" checked={form.allDay} onChange={(e) => set("allDay", e.target.checked)} />
          All day (no specific time)
        </label>

        <div className="rounded-[12px] border border-[var(--color-cs-sep)] p-3">
          <label className="flex items-center gap-2 text-[12.5px] font-medium text-[var(--color-cs-text)]">
            <input
              type="checkbox"
              checked={form.repeats}
              onChange={(e) => set("repeats", e.target.checked)}
              disabled={!form.dueLocal}
            />
            Repeat{!form.dueLocal && " (set a due date first)"}
          </label>
          {form.repeats && (
            <div className="mt-2.5 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-[11px] text-[var(--color-cs-text-secondary)]">
                Every
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.interval}
                  onChange={(e) => set("interval", Number(e.target.value))}
                  className={`${inputCls} w-20`}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-[var(--color-cs-text-secondary)]">
                Period
                <select
                  value={form.freq}
                  onChange={(e) => set("freq", e.target.value as Freq)}
                  className={`${inputCls} w-32`}
                >
                  <option value="daily">Day(s)</option>
                  <option value="weekly">Week(s)</option>
                  <option value="monthly">Month(s)</option>
                  <option value="yearly">Year(s)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-[var(--color-cs-text-secondary)]">
                Until (optional)
                <input
                  type="date"
                  value={form.untilLocal}
                  onChange={(e) => set("untilLocal", e.target.value)}
                  className={`${inputCls} w-40`}
                />
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {programs.length > 0 && (
            <label className="flex flex-col gap-1 text-[11.5px] font-medium text-[var(--color-cs-text-secondary)]">
              Link to program
              <select
                value={form.linkedProgram}
                onChange={(e) => set("linkedProgram", e.target.value)}
                className={inputCls}
              >
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 self-end text-[12.5px] text-[var(--color-cs-text-secondary)]">
            <input
              type="checkbox"
              checked={form.remindViaEmail}
              onChange={(e) => set("remindViaEmail", e.target.checked)}
            />
            Email me when due
          </label>
        </div>

        {error && <p className="text-[12.5px] text-[#c0392b]">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : form.id ? "Save changes" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
