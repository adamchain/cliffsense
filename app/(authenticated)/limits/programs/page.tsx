import { ProgramsForm, type EnrollmentDates } from "@/app/(authenticated)/settings/programs-form";
import { loadLimitsHub } from "@/lib/limits/load-hub";
import { isSnapCategory, normalizeConfidence } from "@/lib/reporting/obligations";

function isoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export default async function LimitsProgramsPage() {
  const hub = await loadLimitsHub();

  return (
    <div>
      <h1 className="cs-big-title mb-1">Programs</h1>
      <p className="mb-5 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Choose what you receive so the right limits, renewals, and interim reports stay separate.
      </p>
      {hub.beneficiaryId ? (
        <div className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <ProgramsForm
            beneficiaryId={hub.beneficiaryId}
            initialPrograms={hub.programRows.map((b) => b.program)}
            initialDates={Object.fromEntries(
              hub.programRows.map((b) => [
                b.program,
                {
                  renewal: isoDate(b.nextRenewalDate),
                  renewalConfidence: normalizeConfidence(b.renewalConfidence),
                  interim: isoDate(b.nextInterimReportDate),
                  interimConfidence: normalizeConfidence(b.interimConfidence),
                  reportingCategory: isSnapCategory(b.reportingCategory) ? b.reportingCategory : null,
                } satisfies EnrollmentDates,
              ]),
            )}
          />
        </div>
      ) : (
        <p className="text-[13.5px] text-[var(--color-cs-text-secondary)]">
          Add a beneficiary profile before choosing programs.
        </p>
      )}
    </div>
  );
}
