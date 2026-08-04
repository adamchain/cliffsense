"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconBell,
  IconChartLine,
  IconClipboardList,
  IconExternalLink,
  IconRefresh,
  IconSparkles,
  IconWallet,
} from "@tabler/icons-react";
import { programCodeKey, programMetaFor } from "@/lib/benefits/program-meta";
import { advisorAskHref, fixThresholdQuestion } from "@/lib/benefits/fix-prompts";
import { ActionCenter } from "@/components/actions/action-center";
import type { ReportingAction } from "@/lib/reporting/reporting-actions";

type AlertRow = {
  _id: string;
  level: string;
  trigger: string;
  message: string;
  status: string;
  createdAt: string;
  dataSnapshot?: {
    thresholdLabel?: string;
    program?: string;
    limitCents?: number;
    currentValueCents?: number;
  };
};

function triggerLabel(trigger: string): string {
  switch (trigger) {
    case "cliff":
      return "Eligibility cliff";
    case "reporting":
      return "Reporting";
    case "snt":
      return "SNT payment";
    case "able":
      return "ABLE";
    case "predictive":
      return "Predictive";
    case "breach":
      return "Limit reached";
    case "trend":
      return "Trend";
    default:
      return trigger;
  }
}

function relativeStamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function iconFor(trigger: string, level: string) {
  if (level === "breach" || level === "critical" || trigger === "cliff") {
    return IconAlertTriangle;
  }
  switch (trigger) {
    case "reporting":
      return IconClipboardList;
    case "trend":
    case "predictive":
      return IconChartLine;
    case "snt":
    case "able":
      return IconWallet;
    default:
      return IconBell;
  }
}

function iconBg(level: string): string {
  if (level === "breach" || level === "critical") return "bg-[#ff3b30]";
  if (level === "warning") return "bg-[var(--color-cs-accent-orange)]";
  return "bg-[var(--color-cs-brand)]";
}

function isTimeSensitive(level: string, trigger: string): boolean {
  return (
    level === "breach" ||
    level === "critical" ||
    trigger === "cliff" ||
    trigger === "reporting"
  );
}

export function AlertsView({
  beneficiaryId,
  reportingActions = [],
}: {
  beneficiaryId: string | null;
  reportingActions?: ReportingAction[];
}) {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new">("new");

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const q =
      filter === "new"
        ? `beneficiaryId=${encodeURIComponent(beneficiaryId)}&status=new`
        : `beneficiaryId=${encodeURIComponent(beneficiaryId)}`;
    const res = await fetch(`/api/alerts?${q}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Failed to load");
      return;
    }
    setRows((data as { alerts: AlertRow[] }).alerts ?? []);
  }, [beneficiaryId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchStatus(id: string, status: "acknowledged" | "dismissed") {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("Update failed");
      return;
    }
    await load();
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

  async function markAllRead() {
    const open = rows.filter((r) => r.status === "new");
    await Promise.all(open.map((r) => patchStatus(r._id, "acknowledged")));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div data-tour="alerts-page">
      <div className="flex items-center justify-between gap-3">
        <h1 className="cs-big-title">Alerts</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cs-circbtn !h-9 !w-9"
            aria-label="Refresh"
            onClick={() => void load()}
          >
            <IconRefresh size={17} stroke={2} />
          </button>
          <button
            type="button"
            className="text-[15px] font-medium text-[var(--color-cs-brand)] disabled:opacity-40"
            onClick={() => void markAllRead()}
            disabled={!rows.some((r) => r.status === "new")}
          >
            Mark all read
          </button>
        </div>
      </div>

      <div
        className="mb-4 mt-3 inline-flex rounded-[10px] bg-[rgba(118,118,128,0.12)] p-0.5"
        role="group"
        aria-label="Alert filter"
      >
        <button
          type="button"
          onClick={() => setFilter("new")}
          className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition ${
            filter === "new"
              ? "bg-white text-[var(--color-cs-text)] shadow-sm"
              : "text-[var(--color-cs-text-secondary)]"
          }`}
          aria-pressed={filter === "new"}
        >
          Needs attention
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition ${
            filter === "all"
              ? "bg-white text-[var(--color-cs-text)] shadow-sm"
              : "text-[var(--color-cs-text-secondary)]"
          }`}
          aria-pressed={filter === "all"}
        >
          All
        </button>
      </div>
      </div>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {reportingActions.length > 0 && (
        <div className="mb-5">
          <ActionCenter actions={reportingActions} />
        </div>
      )}

      <div className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
        Notifications
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>}
        {!loading &&
          rows.map((a) => {
            const snap = a.dataSnapshot;
            const prog = snap?.program ? programCodeKey(snap.program) : null;
            const progMeta = prog ? programMetaFor(prog) : null;
            const Icon = iconFor(a.trigger, a.level);
            const source = progMeta?.label ?? "MyBenefitsPA";
            const title = snap?.thresholdLabel ?? triggerLabel(a.trigger);
            const sensitive = isTimeSensitive(a.level, a.trigger) && a.status === "new";

            return (
              <div
                key={a._id}
                className={`cs-acard ${a.status !== "new" ? "read" : ""}`}
              >
                <div className={`cs-acard-icon ${iconBg(a.level)}`} aria-hidden>
                  <Icon size={20} stroke={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="cs-acard-source truncate">{source}</div>
                    <div className="cs-acard-time">{relativeStamp(a.createdAt)}</div>
                  </div>
                  {sensitive && <div className="cs-acard-badge">Time Sensitive</div>}
                  <div className="cs-acard-title">{title}</div>
                  <p className="cs-acard-body">{a.message}</p>

                  <div className="cs-acard-actions">
                    {(() => {
                      if (!prog || !progMeta || snap?.limitCents == null) return null;
                      const fixHref = advisorAskHref(
                        fixThresholdQuestion({
                          program: prog,
                          label: snap.thresholdLabel ?? progMeta.label,
                          currentValueCents: snap.currentValueCents,
                          limitCents: snap.limitCents,
                          status: a.level === "breach" ? "concern" : "watch",
                        }),
                      );
                      return (
                        <>
                          <Link href={fixHref} className="cs-acard-btn cs-acard-btn-primary">
                            <span className="inline-flex items-center gap-1">
                              <IconSparkles size={13} stroke={1.5} aria-hidden />
                              Ask AI how to fix
                            </span>
                          </Link>
                          <Link href={`/thresholds/${prog}`} className="cs-acard-btn">
                            <span className="inline-flex items-center gap-1">
                              <IconExternalLink size={13} stroke={1.5} aria-hidden />
                              View {progMeta.label}
                            </span>
                          </Link>
                        </>
                      );
                    })()}
                    {a.status === "new" && (
                      <>
                        <button
                          type="button"
                          className="cs-acard-btn"
                          onClick={() => void patchStatus(a._id, "acknowledged")}
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          className="cs-acard-btn cs-acard-btn-ghost"
                          onClick={() => void patchStatus(a._id, "dismissed")}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        {!loading && rows.length === 0 && (
          <div className="cs-acard justify-center py-8 text-center">
            <p className="text-[14px] text-[var(--color-cs-text-secondary)]">
              No alerts{filter === "new" ? " that need attention" : ""}. Sync a bank from Money to
              refresh.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
