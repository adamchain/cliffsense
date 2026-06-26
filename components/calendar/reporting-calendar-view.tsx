"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { programLabel, programMetaFor } from "@/lib/benefits/program-meta";
import { advisorAskHref } from "@/lib/benefits/fix-prompts";
import {
  CHANGE_TYPES,
  fixedScheduleEventsForPrograms,
  REPORTING_SCHEDULES,
  scheduleFor,
  type ReportTrack,
  type ReportVerdict,
} from "@/lib/benefits/reporting-schedules";

type UserDeadline = {
  _id: string;
  program: string | null;
  dueDate: string;
  track: ReportTrack;
  title: string;
  note: string;
  completedAt: string | null;
};

type AgendaItem = {
  id: string;
  date: string;
  program: string | null;
  track: ReportTrack;
  title: string;
  detail: string;
  channelLabel?: string;
  channelUrl?: string;
  source: "generated" | "user";
  completed: boolean;
};

const TRACK_META: Record<
  ReportTrack,
  { label: string; tone: string; bar: string; icon: typeof IconShieldCheck }
> = {
  scheduled: {
    label: "Scheduled — benefits may stop if missed",
    tone: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
    bar: "border-l-[var(--color-cs-danger)]",
    icon: IconAlertTriangle,
  },
  event: {
    label: "Report a change — avoids an overpayment",
    tone: "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]",
    bar: "border-l-[var(--color-cs-brand)]",
    icon: IconShieldCheck,
  },
};

const VERDICT_META: Record<ReportVerdict, { label: string; className: string }> = {
  yes: { label: "Report it", className: "bg-[#fde7e9] text-[#a4262c]" },
  maybe: { label: "Maybe", className: "bg-[#fed9cc] text-[#ca5010]" },
  no: { label: "No need", className: "bg-[#dff6dd] text-[#107c10]" },
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function daysUntil(dateIso: string): number {
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${dateIso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function monthLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function dayLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function countdownText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days}d`;
}

export function ReportingCalendarView({ beneficiaryId }: { beneficiaryId: string | null }) {
  const [programs, setPrograms] = useState<string[]>([]);
  const [deadlines, setDeadlines] = useState<UserDeadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [changeKey, setChangeKey] = useState<string>(CHANGE_TYPES[0].key);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openProgram, setOpenProgram] = useState<string | null>(null);
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

  const enrolledCodes = useMemo(
    () => programs.map((p) => p.toUpperCase()).filter((c) => REPORTING_SCHEDULES[c]),
    [programs],
  );

  const agenda: AgendaItem[] = useMemo(() => {
    const generated = fixedScheduleEventsForPrograms(programs, new Date()).map<AgendaItem>((g) => ({
      id: `gen-${g.program}-${g.title}-${g.date}`,
      date: g.date,
      program: g.program,
      track: g.track,
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
  const months = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of upcoming) {
      const key = monthLabel(item.date);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [upcoming]);

  const change = CHANGE_TYPES.find((c) => c.key === changeKey) ?? CHANGE_TYPES[0];
  const referenceCodes = showAll ? Object.keys(REPORTING_SCHEDULES) : enrolledCodes;

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId) return;
    if (!form.title.trim() || !form.dueDate) return;
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

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Calendar</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Reporting calendar</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Every program&apos;s reporting clock in one place. Two tracks, two reasons:{" "}
        <span className="font-medium text-[var(--color-cs-danger)]">scheduled paperwork</span> you
        must file on time (missing it can suspend a benefit), and{" "}
        <span className="font-medium text-[var(--color-cs-brand)]">change reports</span> filed when
        life changes (filing keeps your benefit accurate and avoids an overpayment). Always confirm
        exact dates with the agency — several rules are mid-change in 2026.
      </p>

      <AppToolbar>
        <ToolbarButton onClick={() => void load()} primary>
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Refresh
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowAdd((s) => !s)}>
          <IconPlus size={16} stroke={1.5} aria-hidden />
          Add a deadline
        </ToolbarButton>
      </AppToolbar>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {/* Add-deadline form */}
      {showAdd && (
        <form
          onSubmit={submitAdd}
          className="mb-3 rounded-lg border border-[var(--color-cs-border)] bg-white p-3 text-[13px]"
        >
          <div className="mb-2 font-medium text-[var(--color-cs-text)]">
            Add a dated deadline (SAR, renewal, recert, appointment)
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Title</span>
              <input
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. SNAP semi-annual report due"
                required
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">
                Due date
              </span>
              <input
                type="date"
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.dueDate}
                min={todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Program</span>
              <select
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
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
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value as ReportTrack }))}
              >
                <option value="scheduled">Scheduled paperwork (deadline)</option>
                <option value="event">Change report</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">
                Note (optional)
              </span>
              <input
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. date printed on the pink envelope"
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-sm px-3 py-1.5 text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm bg-[var(--color-cs-brand)] px-3 py-1.5 text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add deadline"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------------- Agenda ---------------- */}
        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[var(--color-cs-text)]">Upcoming</h2>
          {loading && <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>}
          {!loading && upcoming.length === 0 && (
            <div className="rounded-lg border border-[var(--color-cs-border)] bg-white p-4 text-[13px] text-[var(--color-cs-text-secondary)]">
              No upcoming reporting dates yet. Use{" "}
              <button
                type="button"
                className="text-[var(--color-cs-brand)] hover:underline"
                onClick={() => setShowAdd(true)}
              >
                Add a deadline
              </button>{" "}
              to enter the date printed on a SAR, renewal, or recert form. Fixed seasonal windows
              (SSI monthly wages, LIHEAP, Pennie) appear automatically for your enrolled programs.
            </div>
          )}
          {months.map(([month, items]) => (
            <div key={month} className="mb-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                {month}
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const tm = TRACK_META[item.track];
                  const TIcon = tm.icon;
                  const days = daysUntil(item.date);
                  const meta = item.program ? programMetaFor(item.program) : null;
                  return (
                    <article
                      key={item.id}
                      className={`rounded-lg border border-[var(--color-cs-border)] border-l-4 ${tm.bar} bg-white p-3 text-[13px]`}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-[var(--color-cs-text)]">
                          {dayLabel(item.date)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            days < 0
                              ? "bg-[var(--color-cs-danger)] text-white"
                              : days <= 7
                                ? "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]"
                                : "bg-[var(--color-cs-surface)] text-[var(--color-cs-text-secondary)]"
                          }`}
                        >
                          {countdownText(days)}
                        </span>
                        {meta && (
                          <Link
                            href={`/thresholds/${item.program}`}
                            className="rounded bg-[var(--color-cs-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
                          >
                            {meta.label}
                          </Link>
                        )}
                      </div>
                      <div className="font-medium text-[var(--color-cs-text)]">{item.title}</div>
                      {item.detail && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                          {item.detail}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <TIcon size={13} stroke={1.7} className={tm.tone.split(" ").pop()} aria-hidden />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tm.tone}`}
                        >
                          {item.track === "scheduled" ? "Don't miss" : "Report to stay accurate"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.channelUrl && (
                          <a
                            href={item.channelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-cs-brand)] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
                          >
                            <IconExternalLink size={13} stroke={1.5} aria-hidden />
                            File at {item.channelLabel}
                          </a>
                        )}
                        {!item.channelUrl && item.channelLabel && (
                          <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                            File via {item.channelLabel}
                          </span>
                        )}
                        {item.source === "user" && (
                          <>
                            <button
                              type="button"
                              onClick={() => void setCompleted(item.id.replace(/^usr-/, ""), true)}
                              className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-cs-border)] px-2 py-1 text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
                            >
                              <IconCheck size={13} stroke={1.5} aria-hidden />
                              Done
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(item.id.replace(/^usr-/, ""))}
                              title="Remove"
                              className="inline-flex rounded-sm p-1 text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-danger)]"
                            >
                              <IconTrash size={14} stroke={1.5} aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* ---------------- "Do I need to report this?" helper ---------------- */}
        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[var(--color-cs-text)]">
            Do I need to report this?
          </h2>
          <div className="rounded-lg border border-[var(--color-cs-border)] bg-white p-3 text-[13px]">
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">
                What changed?
              </span>
              <select
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={changeKey}
                onChange={(e) => setChangeKey(e.target.value)}
              >
                {CHANGE_TYPES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 space-y-1.5">
              {(enrolledCodes.length ? enrolledCodes : Object.keys(REPORTING_SCHEDULES)).map(
                (code) => {
                  const entry = change.byProgram[code];
                  if (!entry) return null;
                  const vm = VERDICT_META[entry.verdict];
                  return (
                    <div
                      key={code}
                      className="flex items-start gap-2 rounded border border-[var(--color-cs-border)] px-2.5 py-1.5"
                    >
                      <span className="min-w-[72px] shrink-0 text-[12px] font-semibold text-[var(--color-cs-text)]">
                        {programLabel(code)}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${vm.className}`}
                      >
                        {vm.label}
                      </span>
                      <span className="text-[11px] leading-snug text-[var(--color-cs-text-secondary)]">
                        {entry.note}
                      </span>
                    </div>
                  );
                },
              )}
              {enrolledCodes.length === 0 && (
                <p className="text-[11px] text-[var(--color-cs-text-muted)]">
                  Showing all programs — set your enrolled programs in onboarding to narrow this.
                </p>
              )}
            </div>

            <Link
              href={advisorAskHref(
                `I "${change.label.toLowerCase()}". For my benefits (${
                  (enrolledCodes.length ? enrolledCodes : ["SSI", "SNAP", "Medicaid"]).map(programLabel).join(", ")
                }) in Pennsylvania, which programs do I need to report this to, by when, and through which channel?`,
              )}
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-cs-border)] px-2.5 py-1 text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
            >
              <IconSparkles size={14} stroke={1.5} aria-hidden />
              Ask AI about reporting this
            </Link>
          </div>

          <p className="mt-2 px-1 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
            Over-reporting is common and harmless to fix, but knowing what you <em>don&apos;t</em>{" "}
            need to report cuts the anxiety. This is general guidance, not a determination.
          </p>
        </section>
      </div>

      {/* ---------------- Per-program reporting reference ---------------- */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">
            Reporting rules by program
          </h2>
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="text-[12px] font-medium text-[var(--color-cs-brand)] hover:underline"
          >
            {showAll ? "Show my programs" : "Show all programs"}
          </button>
        </div>
        <div className="space-y-2">
          {referenceCodes.map((code) => {
            const sched = scheduleFor(code);
            if (!sched) return null;
            const meta = programMetaFor(code);
            const open = openProgram === code;
            return (
              <div
                key={code}
                className="overflow-hidden rounded-lg border border-[var(--color-cs-border)] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenProgram(open ? null : code)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--color-cs-surface)]"
                >
                  <span className="flex items-center gap-2">
                    <IconCalendarEvent size={16} stroke={1.6} className="text-[var(--color-cs-brand)]" aria-hidden />
                    <span className="text-[13px] font-semibold text-[var(--color-cs-text)]">
                      {meta?.label ?? code}
                    </span>
                  </span>
                  <IconChevronDown
                    size={16}
                    stroke={1.6}
                    className={`text-[var(--color-cs-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <div className="border-t border-[var(--color-cs-border)] px-3 py-3 text-[13px]">
                    {sched.caveat && (
                      <div className="mb-3 rounded border border-[var(--color-cs-warning)] bg-[var(--color-cs-warning-bg)] px-2.5 py-1.5 text-[12px] text-[var(--color-cs-warning)]">
                        {sched.caveat}
                      </div>
                    )}
                    <ReportColumn
                      title="Scheduled — file on time"
                      tone="text-[var(--color-cs-danger)]"
                      items={sched.scheduled.map((s) => ({
                        head: s.title,
                        body: s.detail,
                        foot: s.deadline,
                      }))}
                    />
                    <ReportColumn
                      title="Report when it happens"
                      tone="text-[var(--color-cs-brand)]"
                      items={sched.eventTriggered.map((s) => ({
                        head: s.title,
                        body: s.detail,
                        foot: s.deadline,
                      }))}
                    />
                    <div className="mt-3">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#107c10]">
                        You do NOT need to report
                      </div>
                      <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-[var(--color-cs-text-secondary)]">
                        {sched.doNotReport.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-cs-border)] pt-2 text-[12px]">
                      <span className="text-[var(--color-cs-text-secondary)]">
                        File via{" "}
                        <span className="font-medium text-[var(--color-cs-text)]">
                          {sched.channel.label}
                        </span>
                        {sched.channel.phone ? ` · ${sched.channel.phone}` : ""}
                      </span>
                      {sched.channel.url && (
                        <a
                          href={sched.channel.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--color-cs-brand)] hover:underline"
                        >
                          <IconExternalLink size={13} stroke={1.5} aria-hidden />
                          Open channel
                        </a>
                      )}
                      <Link
                        href={`/thresholds/${code}`}
                        className="text-[var(--color-cs-brand)] hover:underline"
                      >
                        View {meta?.label ?? code} limits
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {referenceCodes.length === 0 && (
            <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
              No enrolled programs yet.{" "}
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-[var(--color-cs-brand)] hover:underline"
              >
                Show all programs
              </button>
              .
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function ReportColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: string;
  items: { head: string; body: string; foot: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 first:mt-0">
      <div className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>{title}</div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded border border-[var(--color-cs-border)] px-2.5 py-1.5">
            <div className="text-[12px] font-medium text-[var(--color-cs-text)]">{it.head}</div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              {it.body}
            </p>
            <div className="mt-1 text-[11px] font-medium text-[var(--color-cs-text-muted)]">
              ⏱ {it.foot}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
