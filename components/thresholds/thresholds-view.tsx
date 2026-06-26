"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconPencil, IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import { programCodeKey, programLabel } from "@/lib/benefits/program-meta";

type Row = {
  _id: string;
  scope: string;
  systemKey: string | null;
  attached: boolean;
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
  const [editId, setEditId] = useState<string | null>(null);
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

  function openAdd() {
    // Toggle the add form closed only when it's already open in add mode.
    if (showAdd && editId === null) {
      closeForm();
      return;
    }
    setEditId(null);
    setForm({ label: "", thresholdType: "monthly_earned_income", limitDollars: "" });
    setShowAdd(true);
  }

  function startEdit(row: Row) {
    setEditId(row._id);
    setShowAdd(true);
    setForm({
      label: row.label,
      thresholdType:
        row.thresholdType === "asset_balance" ? "asset_balance" : "monthly_earned_income",
      limitDollars: (row.limitCents / 100).toString(),
    });
  }

  function closeForm() {
    setShowAdd(false);
    setEditId(null);
    setForm({ label: "", thresholdType: "monthly_earned_income", limitDollars: "" });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId) return;
    const dollars = Number(form.limitDollars);
    if (!form.label.trim() || !Number.isFinite(dollars) || dollars <= 0) return;
    setSaving(true);
    setError(null);
    const res = editId
      ? await fetch(`/api/thresholds/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            limitCents: Math.round(dollars * 100),
          }),
        })
      : await fetch("/api/thresholds", {
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
    closeForm();
    await load();
  }

  async function toggleAttach(systemKey: string, attached: boolean) {
    if (!beneficiaryId) return;
    setError(null);
    const res = await fetch("/api/thresholds/attach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, systemKey, attached }),
    });
    if (!res.ok) {
      setError("Could not update");
      return;
    }
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
        Reference limits from enrolled programs plus any custom limits you add. Attach or detach the system limits that
        apply to you, and edit custom limits anytime. Figures are informational—always confirm with a benefits counselor
        or agency.
      </p>

      <AppToolbar>
        <ToolbarButton onClick={() => void load()} primary>
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Refresh
        </ToolbarButton>
        <ToolbarButton onClick={openAdd}>
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
          onSubmit={submitForm}
          className="mb-3 rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]"
        >
          <div className="mb-2 font-medium text-[var(--color-cs-text)]">
            {editId ? "Edit limit" : "Add custom limit"}
          </div>
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
                className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5 disabled:opacity-60"
                value={form.thresholdType}
                disabled={editId !== null}
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
              onClick={closeForm}
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

      {data && data.rows.length > 0 && (
        <ProgramCards rows={data.rows} />
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
                const isSystem = r.scope !== "user";
                const cur =
                  r.currentValueCents != null ? formatPlainUsdFromCents(r.currentValueCents) : "—";
                return (
                  <tr
                    key={r._id}
                    className={`border-b border-[var(--color-cs-border)] last:border-0 ${
                      !r.attached ? "opacity-50" : ""
                    }`}
                  >
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
                      {r.attached ? (
                        <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      ) : (
                        <span className="inline-block rounded bg-[var(--color-cs-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-cs-text-muted)]">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {isSystem && r.systemKey && (
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-[11px] font-medium text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
                            onClick={() => void toggleAttach(r.systemKey!, !r.attached)}
                          >
                            {r.attached ? "Detach" : "Attach"}
                          </button>
                        )}
                        {r.scope === "user" && (
                          <>
                            <button
                              type="button"
                              title="Edit limit"
                              className="inline-flex rounded p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-brand)]"
                              onClick={() => startEdit(r)}
                            >
                              <IconPencil size={16} stroke={1.5} />
                            </button>
                            <button
                              type="button"
                              title="Delete custom limit"
                              className="inline-flex rounded p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-danger)]"
                              onClick={() => void removeUserThreshold(r._id)}
                            >
                              <IconTrash size={16} stroke={1.5} />
                            </button>
                          </>
                        )}
                      </div>
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

/**
 * Per-program cards above the table — one card per program with attached limits,
 * showing how many are over (concern) or approaching (watch), linking into the
 * benefit-specific detail page with its "Ask AI how to fix" buttons.
 */
function ProgramCards({ rows }: { rows: Row[] }) {
  const groups = new Map<
    string,
    { code: string; concern: number; watch: number; total: number }
  >();
  for (const r of rows) {
    if (!r.program || !r.attached) continue;
    const code = programCodeKey(r.program);
    const g = groups.get(code) ?? { code, concern: 0, watch: 0, total: 0 };
    g.total += 1;
    if (r.status === "concern") g.concern += 1;
    else if (r.status === "watch") g.watch += 1;
    groups.set(code, g);
  }
  const cards = [...groups.values()].sort(
    (a, b) => b.concern - a.concern || b.watch - a.watch || a.code.localeCompare(b.code),
  );
  if (cards.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
        By program
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const tone =
            c.concern > 0
              ? "border-l-[var(--color-cs-danger)]"
              : c.watch > 0
                ? "border-l-[var(--color-cs-warning)]"
                : "border-l-[#107c10]";
          return (
            <Link
              key={c.code}
              href={`/thresholds/${c.code}`}
              className={`group rounded-lg border border-[var(--color-cs-border)] border-l-4 ${tone} bg-white p-3 transition-shadow hover:shadow-[var(--shadow-cs-card)]`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--color-cs-text)] group-hover:text-[var(--color-cs-brand)]">
                  {programLabel(c.code)}
                </span>
                <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                  {c.total} limit{c.total === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                {c.concern > 0 && (
                  <span className="rounded px-2 py-0.5 bg-[#fde7e9] text-[#a4262c]">
                    {c.concern} over
                  </span>
                )}
                {c.watch > 0 && (
                  <span className="rounded px-2 py-0.5 bg-[#fed9cc] text-[#ca5010]">
                    {c.watch} approaching
                  </span>
                )}
                {c.concern === 0 && c.watch === 0 && (
                  <span className="rounded px-2 py-0.5 bg-[#dff6dd] text-[#107c10]">On track</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
