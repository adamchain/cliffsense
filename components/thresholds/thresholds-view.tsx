"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { formatPlainUsdFromCents } from "@/lib/format/money";

type Row = {
  _id: string;
  scope: string;
  program: string | null;
  thresholdType: string;
  label: string;
  description: string;
  sourceUrl: string;
  limitCents: number;
  warnAtPercent: number;
  currentValueCents: number | null;
  projectedValueCents: number | null;
  status: "ok" | "watch" | "concern";
};

type Payload = {
  programsEnrolled: string[];
  monthPrefix: string;
  metrics: {
    currentEarnedIncomeCents: number;
    projectedEarnedIncomeCents: number;
    maxDepositoryBalanceCents: number;
  };
  rows: Row[];
};

const STATUS: Record<string, { label: string; className: string }> = {
  ok: { label: "On track", className: "bg-[#dff6dd] text-[#107c10]" },
  watch: { label: "Watch", className: "bg-[#fed9cc] text-[#ca5010]" },
  concern: { label: "Review", className: "bg-[#fde7e9] text-[#a4262c]" },
};

export function ThresholdsView({ beneficiaryId }: { beneficiaryId: string | null }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    thresholdType: "monthly_earned_income" as "monthly_earned_income" | "asset_balance",
    limitDollars: "",
  });

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/thresholds?beneficiaryId=${encodeURIComponent(beneficiaryId)}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Failed to load");
      return;
    }
    setData(json as Payload);
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId) return;
    const dollars = Number(form.limitDollars);
    if (!form.label.trim() || !Number.isFinite(dollars) || dollars <= 0) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/thresholds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaryId,
        label: form.label.trim(),
        thresholdType: form.thresholdType,
        limitCents: Math.round(dollars * 100),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Save failed");
      return;
    }
    setShowAdd(false);
    setForm({ label: "", thresholdType: "monthly_earned_income", limitDollars: "" });
    await load();
  }

  async function removeUserThreshold(id: string) {
    if (!confirm("Remove this custom limit?")) return;
    const res = await fetch(`/api/thresholds/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete");
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
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Limits</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Thresholds</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Reference limits from enrolled programs plus any custom limits you add. Figures are informational—always confirm
        with a benefits counselor or agency.
      </p>

      <AppToolbar>
        <ToolbarButton onClick={() => void load()} primary>
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Refresh
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowAdd((v) => !v)}>
          <IconPlus size={16} stroke={1.5} aria-hidden />
          Custom limit
        </ToolbarButton>
      </AppToolbar>

      {data && data.programsEnrolled.length === 0 && (
        <div className="mb-3 rounded border border-[var(--color-cs-border)] bg-white px-3 py-2 text-[13px] text-[var(--color-cs-text-secondary)]">
          Select enrolled programs in{" "}
          <Link href="/onboarding/benefits" className="text-[var(--color-cs-brand)] hover:underline">
            onboarding
          </Link>{" "}
          to attach system reference limits.
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={addCustom}
          className="mb-3 rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]"
        >
          <div className="mb-2 font-medium text-[var(--color-cs-text)]">Add custom limit</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Label</span>
              <input
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Type</span>
              <select
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.thresholdType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    thresholdType: e.target.value as "monthly_earned_income" | "asset_balance",
                  }))
                }
              >
                <option value="monthly_earned_income">Monthly earned (reference)</option>
                <option value="asset_balance">Depository balance (reference)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Limit (USD)</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
                value={form.limitDollars}
                onChange={(e) => setForm((f) => ({ ...f, limitDollars: e.target.value }))}
                required
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
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {data && (
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded border border-[var(--color-cs-border)] bg-white p-3">
            <div className="text-[11px] text-[var(--color-cs-text-secondary)]">Earned (month {data.monthPrefix})</div>
            <div className="text-base font-medium tabular-nums text-[var(--color-cs-text)]">
              {formatPlainUsdFromCents(data.metrics.currentEarnedIncomeCents)}
            </div>
            <div className="text-[11px] text-[var(--color-cs-text-secondary)]">
              Projected {formatPlainUsdFromCents(data.metrics.projectedEarnedIncomeCents)}
            </div>
          </div>
          <div className="rounded border border-[var(--color-cs-border)] bg-white p-3">
            <div className="text-[11px] text-[var(--color-cs-text-secondary)]">Max checking/savings balance</div>
            <div className="text-base font-medium tabular-nums text-[var(--color-cs-text)]">
              {formatPlainUsdFromCents(data.metrics.maxDepositoryBalanceCents)}
            </div>
          </div>
          <div className="rounded border border-[var(--color-cs-border)] bg-white p-3">
            <div className="text-[11px] text-[var(--color-cs-text-secondary)]">Programs</div>
            <div className="text-[13px] text-[var(--color-cs-text)]">
              {data.programsEnrolled.length ? data.programsEnrolled.join(", ") : "—"}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded border border-[var(--color-cs-border)] bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            <tr>
              <th className="px-3 py-2 font-medium">Limit</th>
              <th className="px-3 py-2 font-medium">Program</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Current</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--color-cs-text-secondary)]">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              data?.rows.map((r) => {
                const st = STATUS[r.status] ?? STATUS.ok;
                const cur =
                  r.currentValueCents != null ? formatPlainUsdFromCents(r.currentValueCents) : "—";
                return (
                  <tr key={r._id} className="border-b border-[var(--color-cs-border)] last:border-0">
                    <td className="max-w-[280px] px-3 py-2">
                      <div className="font-medium text-[var(--color-cs-text)]">{r.label}</div>
                      {r.sourceUrl ? (
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[var(--color-cs-brand)] hover:underline"
                        >
                          Source
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-cs-text-secondary)]">{r.program ?? "—"}</td>
                    <td className="px-3 py-2 text-[var(--color-cs-text-secondary)]">{r.thresholdType}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--color-cs-text)]">{cur}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--color-cs-text)]">
                      {formatPlainUsdFromCents(r.limitCents)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.scope === "user" && (
                        <button
                          type="button"
                          title="Delete custom limit"
                          className="inline-flex rounded p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-danger)]"
                          onClick={() => void removeUserThreshold(r._id)}
                        >
                          <IconTrash size={16} stroke={1.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            {!loading && data && data.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--color-cs-text-secondary)]">
                  No thresholds yet. Enroll programs or add a custom limit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
