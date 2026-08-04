"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { programLabel, programMetaFor } from "@/lib/benefits/program-meta";
import {
  fixedScheduleEventsForPrograms,
  REPORTING_SCHEDULES,
  scheduleFor,
  type ReportTrack,
} from "@/lib/benefits/reporting-schedules";
import { calendarEventHref } from "@/lib/calendar/event-id";

type UserDeadline = {
  _id: string;
  program: string | null;
  dueDate: string;
  track: ReportTrack;
  kind?: string;
  sourceKey?: string | null;
  title: string;
  note: string;
  completedAt: string | null;
};

function isRenewalDeadline(d: Pick<UserDeadline, "kind" | "sourceKey" | "title">): boolean {
  if (d.kind === "renewal") return true;
  if (d.sourceKey?.startsWith("renewal:")) return true;
  return /\brenewal\b/i.test(d.title ?? "");
}

type AgendaItem = {
  id: string;
  date: string;
  program: string | null;
  track: ReportTrack;
  kind: string;
  title: string;
  detail: string;
  channelLabel?: string;
  channelUrl?: string;
  source: "generated" | "user";
  completed: boolean;
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(dateIso: string): number {
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${dateIso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function relLabel(dateIso: string): string {
  const days = daysUntil(dateIso);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 21) return `in ${days} days`;
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dayParts(dateIso: string) {
  const d = new Date(`${dateIso}T12:00:00`);
  return {
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    wd: d.toLocaleDateString("en-US", { weekday: "short" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

export function ReportingCalendarView({ beneficiaryId }: { beneficiaryId: string | null }) {
  const [programs, setPrograms] = useState<string[]>([]);
  const [deadlines, setDeadlines] = useState<UserDeadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialMonth = new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    program: "",
    dueDate: "",
    track: "scheduled" as ReportTrack,
    title: "",
    note: "",
  });

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const [tRes, dRes] = await Promise.all([
      fetch(`/api/thresholds?beneficiaryId=${encodeURIComponent(beneficiaryId)}`),
      fetch(`/api/reporting-deadlines?beneficiaryId=${encodeURIComponent(beneficiaryId)}`),
    ]);
    const tJson = await tRes.json().catch(() => ({}));
    const dJson = await dRes.json().catch(() => ({}));
    setLoading(false);
    if (!tRes.ok) {
      setError((tJson as { error?: string }).error ?? "Failed to load");
      return;
    }
    setPrograms((tJson as { programsEnrolled?: string[] }).programsEnrolled ?? []);
    setDeadlines((dJson as { deadlines?: UserDeadline[] }).deadlines ?? []);
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const agenda: AgendaItem[] = useMemo(() => {
    const generated = fixedScheduleEventsForPrograms(programs, new Date()).map<AgendaItem>((g) => ({
      id: `gen-${g.program}-${g.title}-${g.date}`,
      date: g.date,
      program: g.program,
      track: g.track,
      kind: "deadline",
      title: g.title,
      detail: g.detail,
      channelLabel: g.channelLabel,
      channelUrl: g.channelUrl,
      source: "generated",
      completed: false,
    }));
    const userItems = deadlines.map<AgendaItem>((d) => {
      const ch = d.program ? scheduleFor(d.program)?.channel : null;
      return {
        id: `usr-${d._id}`,
        date: d.dueDate,
        program: d.program,
        track: d.track,
        kind: isRenewalDeadline(d) ? "renewal" : (d.kind ?? "deadline"),
        title: d.title,
        detail: d.note,
        channelLabel: ch?.label,
        channelUrl: ch?.url,
        source: "user",
        completed: Boolean(d.completedAt),
      };
    });
    return [...generated, ...userItems].sort((a, b) => a.date.localeCompare(b.date));
  }, [programs, deadlines]);

  const upcoming = agenda.filter((a) => !a.completed);
  const renewals = upcoming
    .filter((a) => a.kind === "renewal")
    .sort((a, b) => a.date.localeCompare(b.date));
  const otherDeadlines = upcoming
    .filter((a) => a.kind !== "renewal")
    .sort((a, b) => a.date.localeCompare(b.date));

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of upcoming) {
      const arr = map.get(item.date) ?? [];
      arr.push(item);
      map.set(item.date, arr);
    }
    return map;
  }, [upcoming]);

  const visibleRenewals = selectedDate
    ? renewals.filter((a) => a.date === selectedDate)
    : renewals;
  const visibleOthers = selectedDate
    ? otherDeadlines.filter((a) => a.date === selectedDate)
    : otherDeadlines;

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId || !form.title.trim() || !form.dueDate) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/reporting-deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaryId,
        program: form.program || null,
        dueDate: form.dueDate,
        track: form.track,
        kind: "deadline",
        title: form.title.trim(),
        note: form.note.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not save");
      return;
    }
    setForm({ program: "", dueDate: "", track: "scheduled", title: "", note: "" });
    setShowAdd(false);
    await load();
  }

  async function setCompleted(id: string, completed: boolean) {
    const res = await fetch(`/api/reporting-deadlines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this deadline?")) return;
    const res = await fetch(`/api/reporting-deadlines/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  if (!beneficiaryId) {
    return (
      <p className="text-sm text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile first.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Continue onboarding
        </Link>
      </p>
    );
  }

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Current month + next two for the left rail
  const monthOffsets = [0, 1, 2];

  return (
    <div className="mx-auto max-w-5xl" data-tour="calendar-page">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="cs-big-title">Calendar</h1>
        <button
          type="button"
          className="cs-circbtn"
          aria-label="Add deadline"
          onClick={() => setShowAdd((s) => !s)}
        >
          <IconPlus size={20} stroke={2.2} />
        </button>
      </div>
      <p className="mb-4 text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Renewals from{" "}
        <Link href="/settings" className="text-[var(--color-cs-brand)]">
          Settings
        </Link>{" "}
        stay at the top. Confirm every date with the agency.
      </p>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {showAdd && (
        <form
          onSubmit={submitAdd}
          className="mb-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-2 text-[16px] font-bold">Add a deadline</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Title</span>
              <input
                className="cs-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. SNAP semi-annual report"
                required
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Due date</span>
              <input
                type="date"
                className="cs-input"
                value={form.dueDate}
                min={todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Program</span>
              <select
                className="cs-input"
                value={form.program}
                onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
              >
                <option value="">General</option>
                {Object.keys(REPORTING_SCHEDULES).map((c) => (
                  <option key={c} value={c}>
                    {programLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Track</span>
              <select
                className="cs-input"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value as ReportTrack }))}
              >
                <option value="scheduled">Scheduled paperwork</option>
                <option value="event">Change report</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="text-[var(--color-cs-brand)]" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="cs-btn cs-btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
        {/* Left: compact multi-month */}
        <div className="max-w-[17.5rem]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[17px] font-bold tracking-tight">{monthTitle}</div>
            <div className="flex gap-1">
              <button
                type="button"
                className="cs-circbtn !h-8 !w-8"
                aria-label="Previous month"
                onClick={() => {
                  const m = viewMonth - 1;
                  if (m < 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else setViewMonth(m);
                }}
              >
                <IconChevronLeft size={16} stroke={2.2} />
              </button>
              <button
                type="button"
                className="cs-circbtn !h-8 !w-8"
                aria-label="Next month"
                onClick={() => {
                  const m = viewMonth + 1;
                  if (m > 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else setViewMonth(m);
                }}
              >
                <IconChevronRight size={16} stroke={2.2} />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {monthOffsets.map((offset) => {
              let y = viewYear;
              let m = viewMonth + offset;
              while (m > 11) {
                m -= 12;
                y += 1;
              }
              const title = new Date(y, m, 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return (
                <MonthGrid
                  key={`${y}-${m}`}
                  year={y}
                  month={m}
                  title={offset === 0 ? undefined : title}
                  compact
                  itemsByDate={itemsByDate}
                  selectedDate={selectedDate}
                  onSelect={(d) => setSelectedDate((cur) => (cur === d ? null : d))}
                />
              );
            })}
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-3 inline-flex items-center gap-1 text-[13px] text-[var(--color-cs-brand)]"
            >
              <IconX size={14} /> Clear day filter
            </button>
          )}

          {/* Mobile agenda under months */}
          <div className="mt-5 lg:hidden">
            {loading ? (
              <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>
            ) : (
              <>
                <AgendaBlock
                  label="Renewals"
                  hint="Vital · from Settings"
                  items={visibleRenewals}
                  empty={
                    selectedDate
                      ? "No renewals on this day."
                      : "No renewal dates yet — set them in Settings."
                  }
                  onDone={(id) => void setCompleted(id, true)}
                  onRemove={(id) => void remove(id)}
                />
                <AgendaBlock
                  label="Reporting deadlines"
                  items={visibleOthers}
                  empty={
                    selectedDate
                      ? "No reporting items on this day."
                      : "No other deadlines yet. Tap + to add one."
                  }
                  onDone={(id) => void setCompleted(id, true)}
                  onRemove={(id) => void remove(id)}
                />
                <TipsCard />
              </>
            )}
          </div>
        </div>

        {/* Right: agenda */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          {loading ? (
            <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>
          ) : (
            <>
              <AgendaBlock
                label="Renewals"
                hint="Vital · from Settings"
                items={visibleRenewals}
                empty={
                  selectedDate
                    ? "No renewals on this day."
                    : "No renewal dates yet — set them in Settings."
                }
                onDone={(id) => void setCompleted(id, true)}
                onRemove={(id) => void remove(id)}
              />
              <AgendaBlock
                label="Reporting deadlines"
                items={visibleOthers}
                empty={
                  selectedDate
                    ? "No reporting items on this day."
                    : "No other deadlines yet. Tap + to add one."
                }
                onDone={(id) => void setCompleted(id, true)}
                onRemove={(id) => void remove(id)}
              />
              <TipsCard />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function TipsCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-bold text-[var(--color-cs-text)]">Tips</span>
        <IconChevronDown
          size={16}
          stroke={2}
          className={`shrink-0 text-[var(--color-cs-text-secondary)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--color-cs-sep)] px-4 py-3 text-[13px]">
          <p className="font-semibold text-[var(--color-cs-text)]">Missing a renewal?</p>
          <p className="mt-1 text-[var(--color-cs-text-secondary)]">
            Enter the date from each agency notice so it appears here and on Home. Confirm every
            date with the agency.
          </p>
          <Link href="/settings" className="mt-2 inline-block font-semibold text-[var(--color-cs-brand)]">
            Set renewal dates in Settings →
          </Link>
        </div>
      )}
    </div>
  );
}

function AgendaBlock({
  label,
  hint,
  items,
  empty,
  onDone,
  onRemove,
}: {
  label: string;
  hint?: string;
  items: AgendaItem[];
  empty: string;
  onDone: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="mt-4 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
          {label}
        </h2>
        {hint && (
          <span className="text-[12px] font-medium text-[var(--color-cs-warning)]">{hint}</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-[18px] bg-[var(--color-cs-card)] px-4 py-4 text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {empty}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const parts = dayParts(item.date);
            const meta = item.program ? programMetaFor(item.program) : null;
            const days = daysUntil(item.date);
            const href = calendarEventHref(
              item.source === "user"
                ? { source: "user", deadlineId: item.id.replace(/^usr-/, "") }
                : {
                    source: "generated",
                    program: item.program ?? "GEN",
                    date: item.date,
                    title: item.title,
                  },
            );
            return (
              <article
                key={item.id}
                className="rounded-[18px] bg-[var(--color-cs-card)] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <Link href={href} className="flex gap-3 text-inherit">
                  <div className="cs-datechip">
                    <div className="m">{parts.mon}</div>
                    <div className="d">{parts.day}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold">{item.title}</div>
                        <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                          {meta?.label ?? "General"} · {parts.full}
                          {item.detail ? ` · ${item.detail}` : ""}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-[13px] font-medium ${
                          days <= 7
                            ? "text-[var(--color-cs-danger)]"
                            : "text-[var(--color-cs-text-secondary)]"
                        }`}
                      >
                        {relLabel(item.date)}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[58px]">
                  {item.channelUrl && (
                    <a
                      href={item.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-cs-brand)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconExternalLink size={12} />
                      {item.channelLabel ?? "File"}
                    </a>
                  )}
                  <Link
                    href={href}
                    className="text-[12px] font-semibold text-[var(--color-cs-brand)]"
                  >
                    Details
                  </Link>
                  {item.program && (
                    <Link
                      href={`/thresholds/${item.program}`}
                      className="text-[12px] font-semibold text-[var(--color-cs-brand)]"
                    >
                      View limits
                    </Link>
                  )}
                  {item.source === "user" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDone(item.id.replace(/^usr-/, ""))}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-cs-success)]"
                      >
                        <IconCheck size={13} /> Done
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id.replace(/^usr-/, ""))}
                        className="inline-flex text-[var(--color-cs-text-muted)]"
                        aria-label="Remove"
                      >
                        <IconTrash size={14} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function MonthGrid({
  year,
  month,
  title,
  compact = false,
  itemsByDate,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  title?: string;
  compact?: boolean;
  itemsByDate: Map<string, AgendaItem[]>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayIso();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateOf = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const cellSize = compact ? "h-8 w-8 text-[12px]" : "h-9 w-9 text-[13px]";

  return (
    <div>
      {title ? (
        <div className="mb-1.5 text-[14px] font-semibold tracking-tight text-[var(--color-cs-text)]">
          {title}
        </div>
      ) : null}

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[10px] font-semibold text-[var(--color-cs-text-secondary)]"
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={`b-${i}`} className="aspect-square" />;
          const date = dateOf(d);
          const items = itemsByDate.get(date) ?? [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const hasEv = items.length > 0;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className="flex aspect-square items-center justify-center"
            >
              <span
                className={`flex ${cellSize} items-center justify-center tabular-nums ${
                  isSelected
                    ? "rounded-[11px] bg-[var(--color-cs-surface)] font-semibold text-[var(--color-cs-text)]"
                    : "rounded-full"
                } ${
                  hasEv
                    ? "box-border border-2 border-[var(--color-cs-pa-red)] font-semibold"
                    : ""
                } ${
                  isToday && !isSelected
                    ? "font-semibold text-[var(--color-cs-pa-red)]"
                    : isToday && isSelected
                      ? "text-[var(--color-cs-pa-red)]"
                      : !isSelected && !hasEv
                        ? "text-[var(--color-cs-text)]"
                        : ""
                }`}
              >
                {d}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
