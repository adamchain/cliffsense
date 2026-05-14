"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconRefresh,
  IconCheck,
  IconDownload,
  IconFilter,
} from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { formatShortDate, formatSignedUsd } from "@/lib/format/money";

type StreamRow = {
  _id: string;
  type: "inflow" | "outflow";
  description: string;
  merchantName: string;
  frequency: string;
  status: string;
  userCategory: string;
  isConfirmed: boolean;
  excludedFromThresholds?: boolean;
  firstDate: string;
  lastDate: string;
  predictedNextDate: string;
  averageAmountCents: number;
  lastAmountCents: number;
};

const CAT_LABEL: Record<string, string> = {
  earned_income: "Earned income",
  benefit_deposit: "Benefit deposit",
  other_income: "Other income",
  subscription: "Subscription",
  rent: "Rent",
  other: "Other",
};

const FREQ_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  semimonthly: "Semi-monthly",
};

function freqLabel(f: string): string {
  return FREQ_LABEL[f] ?? f;
}

export function RecurringView({ beneficiaryId }: { beneficiaryId: string | null }) {
  const [rows, setRows] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/recurring?beneficiaryId=${encodeURIComponent(beneficiaryId)}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Failed to load");
      return;
    }
    setRows((data as { streams: StreamRow[] }).streams ?? []);
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runSync() {
    if (!beneficiaryId) return;
    setSyncing(true);
    setError(null);
    const res = await fetch("/api/plaid/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId }),
    });
    setSyncing(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Sync failed");
      return;
    }
    await load();
  }

  async function patchStream(
    id: string,
    patch: { userCategory?: string; isConfirmed?: boolean; excludedFromThresholds?: boolean },
  ) {
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { stream: StreamRow };
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...data.stream } : r)));
  }

  if (!beneficiaryId) {
    return (
      <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile to see recurring streams.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Complete profile
        </Link>
      </p>
    );
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Recurring</div>
      <h1 className="mb-3.5 text-xl font-medium text-[var(--color-cs-text)]">Recurring streams</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Plaid detects repeating inflows and outflows. Confirm streams and set categories so projections match how you
        think about income and bills.
      </p>

      <AppToolbar>
        <ToolbarButton primary onClick={runSync}>
          <IconRefresh size={16} stroke={1.5} className={syncing ? "animate-spin" : ""} aria-hidden />
          {syncing ? "Syncing…" : "Sync from Plaid"}
        </ToolbarButton>
        <ToolbarButton href="#">
          <IconFilter size={16} stroke={1.5} aria-hidden />
          Filter
        </ToolbarButton>
        <ToolbarButton href="/reports">
          <IconDownload size={16} stroke={1.5} aria-hidden />
          Export
        </ToolbarButton>
      </AppToolbar>

      {error && (
        <p className="mb-3 text-xs text-[var(--color-cs-danger)]" role="alert">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] font-medium text-[var(--color-cs-text-secondary)]">
                <th className="px-3 py-2">Flow</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Cadence</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Avg / last</th>
                <th className="px-3 py-2">Limits</th>
                <th className="px-3 py-2">Review</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">
                    No recurring streams yet. Connect a bank from{" "}
                    <Link href="/accounts" className="text-[var(--color-cs-brand)] hover:underline">
                      Accounts
                    </Link>{" "}
                    and run <strong>Sync from Plaid</strong>.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                  >
                    <td className="px-3 py-2.5 align-top">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                          r.type === "inflow"
                            ? "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]"
                            : "bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-text-secondary)]"
                        }`}
                      >
                        {r.type === "inflow" ? "In" : "Out"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-medium text-[var(--color-cs-text)]">{r.description || "—"}</div>
                      <div className="text-[11px] text-[var(--color-cs-text-secondary)]">
                        {r.merchantName || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-top text-[var(--color-cs-text-secondary)]">
                      {freqLabel(r.frequency)}
                      {r.predictedNextDate ? (
                        <div className="mt-0.5 text-[10px] text-[var(--color-cs-text-muted)]">
                          Next ~ {formatShortDate(r.predictedNextDate)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-top text-[11px] capitalize text-[var(--color-cs-text-secondary)]">
                      {r.status.replace("_", " ")}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <select
                        aria-label="Stream category"
                        className="h-7 max-w-[160px] rounded-sm border border-[var(--color-cs-border)] bg-white px-1.5 text-[11px]"
                        value={r.userCategory}
                        onChange={(e) => void patchStream(r._id, { userCategory: e.target.value })}
                      >
                        {Object.entries(CAT_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-right align-top text-[12px] tabular-nums">
                      <div className={r.averageAmountCents < 0 ? "text-[var(--color-cs-success)]" : ""}>
                        {formatSignedUsd(r.averageAmountCents)}
                      </div>
                      <div className="text-[11px] text-[var(--color-cs-text-muted)]">
                        {formatSignedUsd(r.lastAmountCents)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {r.type === "inflow" && r.userCategory === "earned_income" ? (
                        <label className="flex cursor-pointer items-start gap-2 text-[11px] text-[var(--color-cs-text-secondary)]">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={!r.excludedFromThresholds}
                            onChange={(e) =>
                              void patchStream(r._id, { excludedFromThresholds: !e.target.checked })
                            }
                            aria-label="Count this stream toward earned-income projections"
                          />
                          <span>Project in limits</span>
                        </label>
                      ) : (
                        <span className="text-[11px] text-[var(--color-cs-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {r.isConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-cs-success)]">
                          <IconCheck size={14} aria-hidden />
                          Confirmed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void patchStream(r._id, { isConfirmed: true })}
                          className="rounded-sm border border-[var(--color-cs-border)] bg-white px-2 py-1 text-[11px] text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
                        >
                          Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
