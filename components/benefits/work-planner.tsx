"use client";

import { useMemo, useState } from "react";
import { evaluateWorkPlanner } from "@/lib/benefits/work-planner";

function dollarsToCents(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function WorkPlanner({
  beneficiaryId,
  initialTwpMonths = 0,
}: {
  beneficiaryId?: string | null;
  initialTwpMonths?: number;
}) {
  const [wages, setWages] = useState("");
  const [unearned, setUnearned] = useState("");
  const [twp, setTwp] = useState(initialTwpMonths);
  const [overtimeIsTemporary, setOvertimeIsTemporary] = useState(false);
  const [saveState, setSaveState] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      evaluateWorkPlanner({
        monthlyGrossWagesCents: dollarsToCents(wages),
        otherUnearnedCents: dollarsToCents(unearned),
        twpMonthsUsed: twp,
        overtimeIsTemporary,
      }),
    [wages, unearned, twp, overtimeIsTemporary],
  );

  async function saveTwp() {
    if (!beneficiaryId) return;
    setSaveState("Saving…");
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twpMonthsUsed: twp }),
    });
    setSaveState(res.ok ? "Saved TWP months" : "Could not save");
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">Work and income planner</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Model one month of gross wages against SSI, SSDI TWP/SGA, SNAP, MAWD, and Medicaid categories
        before hours change. Informational only — IRWEs, household size, and MAGI tax rules can
        change the real result.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px]">
          <span className="cs-label">Monthly gross wages</span>
          <input
            className="cs-input mt-1.5"
            inputMode="decimal"
            placeholder="0"
            value={wages}
            onChange={(e) => setWages(e.target.value)}
          />
        </label>
        <label className="block text-[13px]">
          <span className="cs-label">Other unearned (SSDI, etc.)</span>
          <input
            className="cs-input mt-1.5"
            inputMode="decimal"
            placeholder="0"
            value={unearned}
            onChange={(e) => setUnearned(e.target.value)}
          />
        </label>
        <label className="block text-[13px]">
          <span className="cs-label">TWP months already used (0–9)</span>
          <input
            className="cs-input mt-1.5"
            type="number"
            min={0}
            max={9}
            value={twp}
            onChange={(e) => setTwp(Math.min(9, Math.max(0, Number(e.target.value) || 0)))}
          />
        </label>
        <label className="mt-6 flex items-center gap-2 text-[13px] text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            checked={overtimeIsTemporary}
            onChange={(e) => setOvertimeIsTemporary(e.target.checked)}
          />
          This wage level includes temporary overtime
        </label>
      </div>
      {beneficiaryId && (
        <button type="button" className="cs-btn cs-btn-secondary mt-3 text-[12px]" onClick={() => void saveTwp()}>
          Save TWP months on this profile
        </button>
      )}
      {saveState && <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">{saveState}</p>}
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-[var(--color-cs-text)]">{r.program}</p>
              <span
                className={`text-[11px] font-semibold uppercase ${
                  r.status === "concern"
                    ? "text-[var(--color-cs-danger)]"
                    : r.status === "watch"
                      ? "text-[var(--color-cs-warning)]"
                      : "text-[var(--color-cs-text-muted)]"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="mt-1 text-[var(--color-cs-text)]">{r.headline}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">{r.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
