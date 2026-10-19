import { ProgramsForm } from "@/app/(authenticated)/settings/programs-form";
import { loadLimitsHub } from "@/lib/limits/load-hub";

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
            initialRenewals={Object.fromEntries(
              hub.programRows.map((b) => [
                b.program,
                b.nextRenewalDate ? new Date(b.nextRenewalDate).toISOString().slice(0, 10) : null,
              ]),
            )}
            initialReviews={Object.fromEntries(
              hub.programRows.map((b) => [
                b.program,
                b.nextReviewDate ? new Date(b.nextReviewDate).toISOString().slice(0, 10) : null,
              ]),
            )}
            initialSnapCategory={hub.snapCategory}
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
