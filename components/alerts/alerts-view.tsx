"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconRefresh } from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { formatPlainUsdFromCents } from "@/lib/format/money";

type AlertRow = {
  _id: string;
  level: string;
  trigger: string;
  message: string;
  status: string;
  createdAt: string;
  dataSnapshot?: {
    thresholdLabel?: string;
    limitCents?: number;
    currentValueCents?: number;
  };
};

export function AlertsView({ beneficiaryId }: { beneficiaryId: string | null }) {
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

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Alerts</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Alerts</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Informational notices from limit checks. Acknowledge when you&apos;ve reviewed; dismiss if not applicable.
        Email delivery is configured in notification preferences.
      </p>

      <AppToolbar>
        <ToolbarButton onClick={() => void load()} primary>
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Refresh
        </ToolbarButton>
        <ToolbarButton onClick={() => setFilter("new")}>Open only</ToolbarButton>
        <ToolbarButton onClick={() => setFilter("all")}>All</ToolbarButton>
      </AppToolbar>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      <div className="space-y-2">
        {loading && <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>}
        {!loading &&
          rows.map((a) => {
            const snap = a.dataSnapshot;
            const meta =
              snap?.currentValueCents != null && snap?.limitCents != null
                ? `${formatPlainUsdFromCents(snap.currentValueCents)} vs ${formatPlainUsdFromCents(snap.limitCents)}`
                : null;
            return (
              <article
                key={a._id}
                className="rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase text-[var(--color-cs-text-secondary)]">
                    {a.level} · {a.trigger}
                  </span>
                  <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  {a.status === "new" && (
                    <span className="rounded bg-[#deecf9] px-1.5 py-0.5 text-[11px] text-[#2b5797]">New</span>
                  )}
                </div>
                {snap?.thresholdLabel && (
                  <div className="mb-1 text-xs font-medium text-[var(--color-cs-text)]">{snap.thresholdLabel}</div>
                )}
                <p className="text-[var(--color-cs-text)]">{a.message}</p>
                {meta && <p className="mt-1 text-[11px] text-[var(--color-cs-text-secondary)]">{meta}</p>}
                {a.status === "new" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-sm border border-[var(--color-cs-border)] px-2.5 py-1 text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
                      onClick={() => void patchStatus(a._id, "acknowledged")}
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      className="rounded-sm border border-[var(--color-cs-border)] px-2.5 py-1 text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
                      onClick={() => void patchStatus(a._id, "dismissed")}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-[var(--color-cs-text-secondary)]">
            No alerts{filter === "new" ? " in your open queue" : ""}. Run a bank sync from Recurring or Transactions to
            refresh data.
          </p>
        )}
      </div>
    </>
  );
}
