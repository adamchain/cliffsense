"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconEdit, IconTrash, IconPlus, IconRotateClockwise } from "@tabler/icons-react";

export type ThresholdRow = {
  id: string;
  program: string | null;
  state: string | null;
  thresholdType: string;
  limitCents: number;
  comparison: "lte" | "lt" | "gte" | "gt";
  warnAtPercent: number;
  label: string;
  description: string;
  sourceUrl: string;
  systemKey: string | null;
  overridden: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

const THRESHOLD_TYPES = [
  "monthly_earned_income",
  "monthly_unearned_income",
  "monthly_gross_income",
  "annual_income",
  "asset_balance",
  "transaction_amount",
  "custom",
] as const;

const COMPARISONS: { value: ThresholdRow["comparison"]; label: string }[] = [
  { value: "lte", label: "≤ (at or under)" },
  { value: "lt", label: "< (under)" },
  { value: "gte", label: "≥ (at or over)" },
  { value: "gt", label: "> (over)" },
];

const inputCls =
  "h-8 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[12px]";
const labelCls = "flex flex-col gap-0.5 text-[11px] text-[var(--color-cs-text-secondary)]";

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

type FormState = {
  label: string;
  program: string;
  state: string;
  thresholdType: string;
  limit: string;
  comparison: ThresholdRow["comparison"];
  warnPct: string;
  description: string;
  sourceUrl: string;
  systemKey: string;
};

function rowToForm(r: ThresholdRow): FormState {
  return {
    label: r.label,
    program: r.program ?? "",
    state: r.state ?? "",
    thresholdType: r.thresholdType,
    limit: dollars(r.limitCents),
    comparison: r.comparison,
    warnPct: String(Math.round(r.warnAtPercent * 100)),
    description: r.description,
    sourceUrl: r.sourceUrl,
    systemKey: r.systemKey ?? "",
  };
}

const EMPTY_FORM: FormState = {
  label: "",
  program: "",
  state: "",
  thresholdType: "asset_balance",
  limit: "",
  comparison: "lte",
  warnPct: "85",
  description: "",
  sourceUrl: "",
  systemKey: "",
};

/** Create form for a brand-new system threshold. */
function CreateForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setError(null);
    const limitNum = Number(form.limit);
    if (!form.label.trim()) return setError("Label is required.");
    if (!Number.isFinite(limitNum) || limitNum <= 0) return setError("Enter a positive limit.");
    const warn = Number(form.warnPct);
    if (!Number.isFinite(warn) || warn < 0 || warn > 100) return setError("Warn % must be 0–100.");

    setBusy(true);
    const res = await fetch("/api/admin/thresholds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label.trim(),
        thresholdType: form.thresholdType,
        limitCents: Math.round(limitNum * 100),
        comparison: form.comparison,
        warnAtPercent: warn / 100,
        program: form.program.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        description: form.description.trim(),
        sourceUrl: form.sourceUrl.trim(),
        systemKey: form.systemKey.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const dt = (await res.json().catch(() => ({}))) as { error?: string };
      setError(dt.error ?? "Save failed");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <div className="rounded-md border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Label
          <input className={inputCls} value={form.label} onChange={set("label")} placeholder="SSI resource limit (individual)" />
        </label>
        <label className={labelCls}>
          Type
          <select className={inputCls} value={form.thresholdType} onChange={set("thresholdType")}>
            {THRESHOLD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Limit (USD)
          <input className={inputCls} inputMode="decimal" value={form.limit} onChange={set("limit")} placeholder="2000.00" />
        </label>
        <label className={labelCls}>
          Comparison
          <select className={inputCls} value={form.comparison} onChange={set("comparison")}>
            {COMPARISONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Warn at %
          <input className={inputCls} inputMode="numeric" value={form.warnPct} onChange={set("warnPct")} placeholder="85" />
        </label>
        <label className={labelCls}>
          Program
          <input className={inputCls} value={form.program} onChange={set("program")} placeholder="SSI" />
        </label>
        <label className={labelCls}>
          State
          <input className={inputCls} maxLength={2} value={form.state} onChange={set("state")} placeholder="PA" />
        </label>
        <label className={labelCls}>
          System key (optional)
          <input className={inputCls} value={form.systemKey} onChange={set("systemKey")} placeholder="ssi.resource.individual" />
        </label>
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Description
          <input className={inputCls} value={form.description} onChange={set("description")} />
        </label>
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Source URL
          <input className={inputCls} value={form.sourceUrl} onChange={set("sourceUrl")} placeholder="https://…" />
        </label>
      </div>
      {error && <p className="mt-2 text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="h-8 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Create threshold"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 rounded-sm border border-[var(--color-cs-border)] px-3 text-[12px] text-[var(--color-cs-text-secondary)] hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Edit form bound to a specific row id (PATCH target resolved correctly). */
function EditRowForm({ row, onDone }: { row: ThresholdRow; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(rowToForm(row));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError(null);
    const limitNum = Number(form.limit);
    if (!form.label.trim()) return setError("Label is required.");
    if (!Number.isFinite(limitNum) || limitNum <= 0) return setError("Enter a positive limit.");
    const warn = Number(form.warnPct);
    if (!Number.isFinite(warn) || warn < 0 || warn > 100) return setError("Warn % must be 0–100.");
    setBusy(true);
    const res = await fetch(`/api/admin/thresholds/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label.trim(),
        limitCents: Math.round(limitNum * 100),
        comparison: form.comparison,
        warnAtPercent: warn / 100,
        program: form.program.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        description: form.description.trim(),
        sourceUrl: form.sourceUrl.trim(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const dt = (await res.json().catch(() => ({}))) as { error?: string };
      setError(dt.error ?? "Save failed");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <div className="rounded-md border border-[var(--color-cs-brand)] bg-[var(--color-cs-surface)] p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Label
          <input className={inputCls} value={form.label} onChange={set("label")} />
        </label>
        <label className={labelCls}>
          Limit (USD)
          <input className={inputCls} inputMode="decimal" value={form.limit} onChange={set("limit")} />
        </label>
        <label className={labelCls}>
          Comparison
          <select className={inputCls} value={form.comparison} onChange={set("comparison")}>
            {COMPARISONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Warn at %
          <input className={inputCls} inputMode="numeric" value={form.warnPct} onChange={set("warnPct")} />
        </label>
        <label className={labelCls}>
          Program
          <input className={inputCls} value={form.program} onChange={set("program")} />
        </label>
        <label className={labelCls}>
          State
          <input className={inputCls} maxLength={2} value={form.state} onChange={set("state")} />
        </label>
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Description
          <input className={inputCls} value={form.description} onChange={set("description")} />
        </label>
        <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
          Source URL
          <input className={inputCls} value={form.sourceUrl} onChange={set("sourceUrl")} />
        </label>
      </div>
      {row.systemKey && (
        <p className="mt-2 text-[11px] text-[var(--color-cs-text-muted)]">
          Bundled row <code className="rounded bg-white px-1">{row.systemKey}</code> — saving pins it
          against the seed until you reset.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="h-8 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-8 rounded-sm border border-[var(--color-cs-border)] px-3 text-[12px] text-[var(--color-cs-text-secondary)] hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RowActions({ row }: { row: ThresholdRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "delete" | "reset">(null);

  async function remove() {
    if (!confirm(`Delete "${row.label}"?${row.systemKey ? " It will be re-created on the next seed unless removed from code." : ""}`))
      return;
    setBusy("delete");
    const res = await fetch(`/api/admin/thresholds/${row.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
  }
  async function reset() {
    if (!confirm(`Reset "${row.label}" to its bundled default?`)) return;
    setBusy("reset");
    const res = await fetch(`/api/admin/thresholds/${row.id}`, { method: "POST" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {row.overridden && row.systemKey && (
        <button
          type="button"
          onClick={reset}
          disabled={busy !== null}
          title="Reset to bundled default"
          className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-cs-border)] px-2 py-1 text-[11px] text-[var(--color-cs-text-secondary)] hover:bg-white disabled:opacity-50"
        >
          <IconRotateClockwise size={13} stroke={1.8} aria-hidden />
          {busy === "reset" ? "…" : "Reset"}
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null}
        title="Delete"
        className="inline-flex items-center rounded-sm border border-[var(--color-cs-danger)] px-2 py-1 text-[11px] text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)] disabled:opacity-50"
      >
        <IconTrash size={13} stroke={1.8} aria-hidden />
      </button>
    </div>
  );
}

export function ThresholdEditor({ rows }: { rows: ThresholdRow[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = new Map<string, ThresholdRow[]>();
  for (const r of rows) {
    const key = r.program ?? "—";
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-4">
      <div>
        {creating ? (
          <CreateForm onCancel={() => setCreating(false)} onDone={() => setCreating(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
          >
            <IconPlus size={16} stroke={1.8} aria-hidden />
            New system threshold
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          No system thresholds yet. Create one above, or run the seed script.
        </p>
      ) : (
        Array.from(grouped.entries()).map(([program, list]) => (
          <section
            key={program}
            className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white"
          >
            <header className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              {program} <span className="text-[var(--color-cs-text-muted)]">({list.length})</span>
            </header>
            <div className="divide-y divide-[var(--color-cs-border)]">
              {list.map((t) =>
                editingId === t.id ? (
                  <div key={t.id} className="p-3">
                    <EditRowForm row={t} onDone={() => setEditingId(null)} />
                  </div>
                ) : (
                  <div key={t.id} className="flex flex-wrap items-start gap-3 px-3 py-2.5 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-[var(--color-cs-text)]">{t.label}</span>
                        {t.systemKey ? (
                          t.overridden ? (
                            <span className="rounded bg-[var(--color-cs-warning-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-warning)]">
                              Overridden
                            </span>
                          ) : (
                            <span className="rounded bg-[var(--color-cs-surface)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-text-secondary)]">
                              Bundled
                            </span>
                          )
                        ) : (
                          <span className="rounded bg-[var(--color-cs-info-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-info)]">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--color-cs-text-secondary)]">
                        {t.state ? `${t.state} · ` : ""}
                        {t.thresholdType.replace(/_/g, " ")} · warn {Math.round(t.warnAtPercent * 100)}%
                        {t.systemKey ? ` · ${t.systemKey}` : ""}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-semibold text-[var(--color-cs-text)]">
                        {t.comparison} ${dollars(t.limitCents)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(t.id)}
                        title="Edit"
                        className="inline-flex items-center rounded-sm border border-[var(--color-cs-border)] px-2 py-1 text-[11px] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
                      >
                        <IconEdit size={13} stroke={1.8} aria-hidden />
                      </button>
                      <RowActions row={t} />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
