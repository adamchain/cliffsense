"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { programLabel } from "@/lib/benefits/program-meta";
import { ProgramPicker } from "@/components/benefits/program-picker";
import { expandLegacyMedicaidSelection, type Program } from "@/lib/programs";
import {
  DATE_CONFIDENCES,
  DATE_CONFIDENCE_LABEL,
  RENEWAL_IS_ONE_DEADLINE,
  SNAP_CATEGORY_RULES,
  SNAP_REPORTING_CATEGORIES,
  obligationRuleFor,
  type DateConfidence,
  type SnapReportingCategory,
} from "@/lib/reporting/obligations";

export type EnrollmentDates = {
  renewal: string | null;
  renewalConfidence: DateConfidence;
  interim: string | null;
  interimConfidence: DateConfidence;
  reportingCategory: SnapReportingCategory | null;
};

const EMPTY_DATES: EnrollmentDates = {
  renewal: null,
  renewalConfidence: "needs_confirmation",
  interim: null,
  interimConfidence: "needs_confirmation",
  reportingCategory: null,
};

/** Programs with a scheduled report between renewals (shown with an interim date field). */
function hasInterimField(program: string): boolean {
  return Boolean(obligationRuleFor(program)?.interim);
}

function ConfidenceSelect({
  value,
  onChange,
  label,
}: {
  value: DateConfidence;
  onChange: (v: DateConfidence) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      className="cs-input h-10 max-w-[14rem] text-[12.5px]"
      value={value}
      onChange={(e) => onChange(e.target.value as DateConfidence)}
    >
      {DATE_CONFIDENCES.map((c) => (
        <option key={c} value={c}>
          {DATE_CONFIDENCE_LABEL[c]}
        </option>
      ))}
    </select>
  );
}

export function ProgramsForm({
  beneficiaryId,
  initialPrograms,
  initialDates = {},
  variant,
}: {
  beneficiaryId: string;
  initialPrograms: string[];
  /** Dates keyed by program — preserved when toggling enrollment. */
  initialDates?: Record<string, Partial<EnrollmentDates>>;
  /** Enrollment lives in Settings. Renewal dates are edited on each program page. */
  variant: "enrollment" | "dates";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(expandLegacyMedicaidSelection(initialPrograms)),
  );
  const [dates, setDates] = useState<Record<string, Partial<EnrollmentDates>>>(initialDates);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedSorted = useMemo(
    () =>
      [...selected].sort((a, b) => programLabel(a).localeCompare(programLabel(b))),
    [selected],
  );

  function toggle(p: Program) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function datesFor(program: string): EnrollmentDates {
    return { ...EMPTY_DATES, ...dates[program] };
  }

  function update(program: string, patch: Partial<EnrollmentDates>) {
    setSaved(false);
    setDates((prev) => ({ ...prev, [program]: { ...prev[program], ...patch } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const benefitsEnrolled = [...selected].map((program) => {
      if (variant === "enrollment") {
        // Omit date fields so an enrollment save keeps renewal dates already stored.
        return { program: program as Program };
      }
      const d = datesFor(program);
      return {
        program: program as Program,
        nextRenewalDate: d.renewal,
        renewalConfidence: d.renewalConfidence,
        nextInterimReportDate: hasInterimField(program) ? d.interim : null,
        interimConfidence: d.interimConfidence,
        ...(program === "SNAP" ? { reportingCategory: d.reportingCategory ?? "unknown" } : {}),
      };
    });
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(variant === "enrollment" ? "Could not save programs" : "Could not save dates");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {variant === "enrollment" && (
        <div>
          <p className="mb-2.5 text-[12px] text-[var(--color-cs-text-secondary)]">
            Reference limits attach automatically for the programs you select. Medicaid is split by
            category so ABD, MAGI, Waiver, and MAWD limits stay separate.
          </p>
          <ProgramPicker selected={selected} onToggle={toggle} />
        </div>
      )}

      {variant === "dates" && (
      <div>
        <h3 className="mb-0.5 text-[13px] font-semibold text-[var(--color-cs-text)]">
          Renewal, review &amp; interim report dates
        </h3>
        <p className="mb-1 text-[12px] font-medium text-[var(--color-cs-warning)]">
          Vital — missing a renewal or a scheduled report can pause or end a benefit.
        </p>
        <p className="mb-2.5 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
          {RENEWAL_IS_ONE_DEADLINE} Enter each date from the program&apos;s notice and say where it
          came from. Bene-Watch never works out a report date from the renewal date.
        </p>

        {selectedSorted.length === 0 ? (
          <p className="rounded-[14px] bg-[var(--color-cs-surface)] px-3.5 py-3 text-[13px] text-[var(--color-cs-text-secondary)]">
            No programs yet.{" "}
            <Link href="/settings#programs" className="text-[var(--color-cs-brand)] hover:underline">
              Choose them in Settings
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[var(--color-cs-sep)]">
            {selectedSorted.map((program, i) => {
              const d = datesFor(program);
              const rule = obligationRuleFor(program);
              const snapRule =
                program === "SNAP" ? SNAP_CATEGORY_RULES[d.reportingCategory ?? "unknown"] : null;
              return (
                <div
                  key={program}
                  className={`space-y-2.5 px-3.5 py-3 ${
                    i > 0 ? "border-t border-[var(--color-cs-sep)]" : ""
                  }`}
                >
                  <span className="block text-[15px] font-semibold text-[var(--color-cs-text)]">
                    {programLabel(program)}
                  </span>

                  {program === "SNAP" && (
                    <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
                        Reporting category
                      </span>
                      <select
                        className="cs-input h-10 max-w-[18rem] text-[12.5px]"
                        value={d.reportingCategory ?? "unknown"}
                        onChange={(e) =>
                          update(program, {
                            reportingCategory: e.target.value as SnapReportingCategory,
                          })
                        }
                      >
                        {SNAP_REPORTING_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {SNAP_CATEGORY_RULES[c].label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {snapRule && (
                    <p className="text-[11.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                      {snapRule.who} {snapRule.interimNote}
                      {snapRule.needsConfirmation ? " Confirm against your notice." : ""}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
                      {rule?.reviews[0]?.label ?? "Next renewal"} due
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        aria-label={`${programLabel(program)} renewal date`}
                        className="cs-input h-10 max-w-[11.5rem] sm:text-right"
                        value={d.renewal ?? ""}
                        onChange={(e) => update(program, { renewal: e.target.value || null })}
                      />
                      <ConfidenceSelect
                        label={`${programLabel(program)} renewal date source`}
                        value={d.renewalConfidence}
                        onChange={(v) => update(program, { renewalConfidence: v })}
                      />
                    </span>
                  </div>

                  {hasInterimField(program) && (
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
                        Next {rule?.interim?.label ?? "interim report"}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <input
                          type="date"
                          aria-label={`${programLabel(program)} interim report date`}
                          className="cs-input h-10 max-w-[11.5rem] sm:text-right"
                          value={d.interim ?? ""}
                          onChange={(e) => update(program, { interim: e.target.value || null })}
                        />
                        <ConfidenceSelect
                          label={`${programLabel(program)} interim report date source`}
                          value={d.interimConfidence}
                          onChange={(v) => update(program, { interimConfidence: v })}
                        />
                      </span>
                    </div>
                  )}

                  {rule && (
                    <p className="text-[11.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                      Changes to report: {rule.changeReporting.deadline.toLowerCase()}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      {(variant === "enrollment" || selectedSorted.length > 0) && (
      <div className="flex items-center gap-3 border-t border-[var(--color-cs-sep)] pt-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : variant === "enrollment" ? "Save programs" : "Save dates"}
        </button>
        {saved && <span className="text-[12px] text-[var(--color-cs-success)]">Saved</span>}
      </div>
      )}
    </form>
  );
}
