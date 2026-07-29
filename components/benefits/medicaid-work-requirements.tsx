"use client";

import { useMemo, useState } from "react";

/**
 * Informational tracker for the Medicaid expansion work requirement effective
 * Jan 1, 2027 (ages 19–64). Hours calculator + exemption / appeals reference.
 * Not a compliance determination — confirm with CAO / COMPASS.
 */

const MONTHLY_HOURS_TARGET = 80;
/** Rough paid-work equivalent Frank cited (~$580/mo at ~$7.25×80). */
const PAID_WORK_DOLLARS_HINT = 580;

type ActivityRow = { id: string; label: string; hours: string };

const DEFAULT_ROWS: ActivityRow[] = [
  { id: "paid", label: "Paid work", hours: "" },
  { id: "volunteer", label: "Volunteering / community service", hours: "" },
  { id: "training", label: "Job training / workforce program", hours: "" },
  { id: "education", label: "Half-time (or more) education", hours: "" },
];

const EXEMPTIONS = [
  "Pregnant",
  "Primary caregiver of a dependent child or incapacitated person",
  "Receiving unemployment compensation",
  "Participating in a substance-use disorder treatment program",
  "Medically frail — diagnosis alone is not enough; documentation must show the condition limits the ability to meet 80 hours/month",
  "American Indian / Alaska Native (where the state adopts that exemption)",
];

export function MedicaidWorkRequirements() {
  const [rows, setRows] = useState<ActivityRow[]>(DEFAULT_ROWS);
  const [frailNote, setFrailNote] = useState(false);

  const total = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const n = Number.parseFloat(r.hours);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0),
    [rows],
  );
  const met = total >= MONTHLY_HOURS_TARGET;
  const remaining = Math.max(0, MONTHLY_HOURS_TARGET - total);

  function setHours(id: string, hours: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, hours } : r)));
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">
        Medicaid work requirements — Pennsylvania expansion (2027)
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Effective <span className="font-medium text-[var(--color-cs-text)]">January 1, 2027</span> for
        ages 19–64 in Medicaid expansion. Most enrollees must document{" "}
        <span className="font-medium text-[var(--color-cs-text)]">80 hours/month</span> of qualifying
        activity (paid work ≈ ${PAID_WORK_DOLLARS_HINT}/mo, volunteering, training, half-time education,
        or a combination) — or qualify for an exemption. Informational only; COMPASS / your county
        assistance office make the determination.
      </p>

      <div className="mt-3 grid gap-4 rounded border border-[var(--color-cs-border)] bg-white p-4 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Monthly hours tracker
          </p>
          <div className="mt-2 space-y-2">
            {rows.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-[13px]">
                <span className="w-[11.5rem] shrink-0 text-[var(--color-cs-text-secondary)]">
                  {r.label}
                </span>
                <input
                  inputMode="decimal"
                  value={r.hours}
                  onChange={(e) => setHours(r.id, e.target.value)}
                  placeholder="0"
                  className="h-8 w-20 rounded-sm border border-[var(--color-cs-border)] px-2 text-[13px] tabular-nums outline-none focus:border-[var(--color-cs-brand)]"
                />
                <span className="text-[11px] text-[var(--color-cs-text-muted)]">hrs</span>
              </label>
            ))}
          </div>
          <div
            className={`mt-3 rounded-md px-3 py-2 text-[13px] ${
              met ? "bg-[#dff6dd] text-[#107c10]" : "bg-[#fff4ce] text-[#8a5400]"
            }`}
          >
            <span className="font-medium tabular-nums">{total.toFixed(1)}</span> / {MONTHLY_HOURS_TARGET}{" "}
            hours
            {met ? " — on track for this month." : ` — ${remaining.toFixed(1)} still needed.`}
          </div>
          <label className="mt-3 flex items-start gap-2 text-[12px] text-[var(--color-cs-text-secondary)]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={frailNote}
              onChange={(e) => setFrailNote(e.target.checked)}
            />
            <span>
              Reviewing a medical-frailty exemption? Diagnosis alone is insufficient — keep records that
              show the condition limits the ability to complete 80 hours.
            </span>
          </label>
        </div>

        <div className="space-y-3 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          <div>
            <p className="font-medium text-[var(--color-cs-text)]">Common exemptions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {EXEMPTIONS.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-[var(--color-cs-text)]">2027 → 2028 documentation cliff</p>
            <p className="mt-1">
              2027 may allow self-attestation of hours or exemptions. Expect a documentation cliff in
              2028 — save pay stubs, timesheets, school enrollment, and medical letters in the Vault
              under <span className="font-medium text-[var(--color-cs-text)]">Work &amp; activity</span>{" "}
              and <span className="font-medium text-[var(--color-cs-text)]">Proof of disability</span>.
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-cs-text)]">Reporting</p>
            <p className="mt-1">
              Report through{" "}
              <a
                href="https://www.compass.state.pa.us/"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-cs-brand)] hover:underline"
              >
                COMPASS
              </a>{" "}
              or your County Assistance Office (CAO).
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-cs-text)]">Appeals</p>
            <p className="mt-1">
              File within <span className="font-medium text-[var(--color-cs-text)]">30 days</span>. If
              you appeal before the effective date of the action, ask for{" "}
              <span className="font-medium text-[var(--color-cs-text)]">aid continuing</span>. Path:
              Bureau of Hearings and Appeals (BHA) → Administrative Law Judge → 15-day reconsideration
              → Commonwealth Court. Help: Pennsylvania Health Law Project{" "}
              <a href="tel:18002743258" className="text-[var(--color-cs-brand)] hover:underline">
                1-800-274-3258
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
