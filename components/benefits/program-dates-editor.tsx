"use client";

import { useState } from "react";
import { programCodeKey } from "@/lib/benefits/program-meta";
import { STORED_PROGRAMS } from "@/lib/programs";
import {
  DATE_CONFIDENCES,
  DATE_CONFIDENCE_LABEL,
  SNAP_CATEGORY_RULES,
  SNAP_REPORTING_CATEGORIES,
  obligationRuleFor,
  type DateConfidence,
  type SnapReportingCategory,
} from "@/lib/reporting/obligations";

export type ProgramDateValues = {
  renewal: string | null;
  renewalConfidence: DateConfidence;
  interim: string | null;
  interimConfidence: DateConfidence;
  reportingCategory: SnapReportingCategory | null;
};

function isoDate(value: string | null | undefined): string {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function hasInterimField(program: string): boolean {
  return Boolean(obligationRuleFor(program)?.interim);
}

export function ProgramDatesEditor({
  beneficiaryId,
  program,
  enrolledPrograms,
  initial,
  onSaved,
}: {
  beneficiaryId: string;
  program: string;
  /** Every enrolled program. The save sends all of them so other programs keep their dates. */
  enrolledPrograms: string[];
  initial: ProgramDateValues;
  onSaved?: () => void;
}) {
  const code = programCodeKey(program);
  const rule = obligationRuleFor(code);
  const renewalLabel = rule?.reviews[0]?.label ?? "Next renewal";
  const [renewal, setRenewal] = useState(isoDate(initial.renewal));
  const [renewalConfidence, setRenewalConfidence] = useState<DateConfidence>(
    initial.renewalConfidence,
  );
  const [interim, setInterim] = useState(isoDate(initial.interim));
  const [interimConfidence, setInterimConfidence] = useState<DateConfidence>(
    initial.interimConfidence,
  );
  const [category, setCategory] = useState<SnapReportingCategory>(
    initial.reportingCategory ?? "unknown",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const snapRule = code === "SNAP" ? SNAP_CATEGORY_RULES[category] : null;
  const showInterim = hasInterimField(code);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const stored =
      enrolledPrograms.find((p) => programCodeKey(p) === code) ??
      STORED_PROGRAMS.find((p) => programCodeKey(p) === code) ??
      code;
    const programs = enrolledPrograms.some((p) => programCodeKey(p) === code)
      ? enrolledPrograms
      : [...enrolledPrograms, stored];
    const benefitsEnrolled = programs.map((p) => {
      if (programCodeKey(p) !== code) return { program: p };
      return {
        program: stored,
        nextRenewalDate: renewal || null,
        renewalConfidence,
        nextInterimReportDate: showInterim ? interim || null : null,
        interimConfidence,
        ...(code === "SNAP" ? { reportingCategory: category } : {}),
      };
    });
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save dates");
      return;
    }
    setSaved(true);
    onSaved?.();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
    >
      <p className="text-[13px] font-medium text-[var(--color-cs-warning)]">
        Missing a renewal or a scheduled report can pause or end a benefit.
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        Enter each date from the notice. A report date is never calculated from the renewal date.
      </p>

      <div className="mt-4 space-y-4">
        {code === "SNAP" && (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-cs-text)]">
              Reporting category
            </span>
            <select
              className="cs-input"
              value={category}
              onChange={(e) => {
                setSaved(false);
                setCategory(e.target.value as SnapReportingCategory);
              }}
            >
              {SNAP_REPORTING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {SNAP_CATEGORY_RULES[c].label}
                </option>
              ))}
            </select>
            {snapRule && (
              <span className="mt-1.5 block text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                {snapRule.interimNote}
                {snapRule.needsConfirmation ? " Confirm against your notice." : ""}
              </span>
            )}
          </label>
        )}

        <div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-cs-text)]">
              {renewalLabel} due
            </span>
            <input
              type="date"
              className="cs-input"
              value={renewal}
              onChange={(e) => {
                setSaved(false);
                setRenewal(e.target.value);
              }}
            />
          </label>
          <label className="mt-2 block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-cs-text-secondary)]">
              Where this date came from
            </span>
            <select
              className="cs-input"
              value={renewalConfidence}
              onChange={(e) => {
                setSaved(false);
                setRenewalConfidence(e.target.value as DateConfidence);
              }}
            >
              {DATE_CONFIDENCES.map((c) => (
                <option key={c} value={c}>
                  {DATE_CONFIDENCE_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showInterim && (
          <div>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-cs-text)]">
                Next {rule?.interim?.label ?? "interim report"}
              </span>
              <input
                type="date"
                className="cs-input"
                value={interim}
                onChange={(e) => {
                  setSaved(false);
                  setInterim(e.target.value);
                }}
              />
            </label>
            {code !== "SNAP" && rule?.interim?.frequency && (
              <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                {rule.interim.frequency}
              </p>
            )}
            <label className="mt-2 block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-cs-text-secondary)]">
                Where this date came from
              </span>
              <select
                className="cs-input"
                value={interimConfidence}
                onChange={(e) => {
                  setSaved(false);
                  setInterimConfidence(e.target.value as DateConfidence);
                }}
              >
                {DATE_CONFIDENCES.map((c) => (
                  <option key={c} value={c}>
                    {DATE_CONFIDENCE_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {rule && (
          <p className="text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
            <span className="font-medium text-[var(--color-cs-text)]">Changes to report:</span>{" "}
            {rule.changeReporting.deadline}. {rule.changeReporting.what}
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      <div className="mt-4 flex items-center gap-3 border-t border-[var(--color-cs-sep)] pt-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save dates"}
        </button>
        {saved && <span className="text-[12px] text-[var(--color-cs-success)]">Saved</span>}
      </div>
    </form>
  );
}
