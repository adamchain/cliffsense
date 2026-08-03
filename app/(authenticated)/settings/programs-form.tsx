"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { programLabel } from "@/lib/benefits/program-meta";
import { PROGRAMS, type Program } from "@/lib/programs";

export function ProgramsForm({
  beneficiaryId,
  initialPrograms,
  initialRenewals = {},
}: {
  beneficiaryId: string;
  initialPrograms: string[];
  /** YYYY-MM-DD keyed by program — preserved when toggling enrollment. */
  initialRenewals?: Record<string, string | null>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialPrograms));
  const [renewals, setRenewals] = useState<Record<string, string | null>>(initialRenewals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedSorted = useMemo(
    () =>
      [...selected].sort((a, b) => programLabel(a).localeCompare(programLabel(b))),
    [selected],
  );

  function toggle(p: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function setDate(program: string, nextRenewalDate: string) {
    setSaved(false);
    setRenewals((prev) => ({
      ...prev,
      [program]: nextRenewalDate || null,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const benefitsEnrolled = [...selected].map((program) => ({
      program: program as Program,
      nextRenewalDate: renewals[program] ?? null,
    }));
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save programs and renewal dates");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h3 className="mb-1 text-[13px] font-semibold text-[var(--color-cs-text)]">
          Enrolled programs
        </h3>
        <p className="mb-2.5 text-[12px] text-[var(--color-cs-text-secondary)]">
          Reference limits attach automatically for the programs you select.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROGRAMS.map((p) => {
            const on = selected.has(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={`rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  on
                    ? "border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] py-[7px]"
                    : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-cs-sep)] pt-4">
        <h3 className="mb-0.5 text-[13px] font-semibold text-[var(--color-cs-text)]">
          Renewal &amp; recert dates
        </h3>
        <p className="mb-1 text-[12px] font-medium text-[var(--color-cs-warning)]">
          Vital — missing a renewal can pause or end a benefit.
        </p>
        <p className="mb-2.5 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
          Enter the next date from each program&apos;s notice. These show at the top of Home and
          Calendar.
        </p>

        {selectedSorted.length === 0 ? (
          <p className="rounded-[14px] bg-[var(--color-cs-surface)] px-3.5 py-3 text-[13px] text-[var(--color-cs-text-secondary)]">
            Select programs above to add renewal dates.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[var(--color-cs-sep)]">
            {selectedSorted.map((program, i) => (
              <label
                key={program}
                className={`flex flex-col gap-1.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  i > 0 ? "border-t border-[var(--color-cs-sep)]" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--color-cs-text)]">
                    {programLabel(program)}
                  </span>
                  <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
                    Next renewal due
                  </span>
                </span>
                <input
                  type="date"
                  className="cs-input h-10 max-w-[11.5rem] sm:text-right"
                  value={renewals[program] ?? ""}
                  onChange={(e) => setDate(program, e.target.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex items-center gap-3 border-t border-[var(--color-cs-sep)] pt-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save programs & renewals"}
        </button>
        {saved && <span className="text-[12px] text-[var(--color-cs-success)]">Saved</span>}
      </div>
    </form>
  );
}
