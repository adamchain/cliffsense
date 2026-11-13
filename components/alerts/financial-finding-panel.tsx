import type { FinancialFinding } from "@/lib/alerts/financial-finding";

const CONFIDENCE: Record<FinancialFinding["deadlineConfidence"], string> = {
  confirmed: "Taken from a notice",
  estimated: "Estimated from the program clock",
  unknown: "No deadline calculated",
};

export function FinancialFindingPanel({ finding }: { finding: FinancialFinding }) {
  return (
    <dl className="mt-2 space-y-2 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
      <FindingField label="What changed" value={finding.whatChanged} />
      <FindingField label="What counts" value={finding.whatCounts} />
      <FindingField label="What is the risk" value={finding.riskText} />
      <FindingField label="What should I do" value={finding.whatToDo} />
      <p className="text-[11px] text-[var(--color-cs-text-muted)]">
        Deadline confidence: {CONFIDENCE[finding.deadlineConfidence]}. Bene-Watch does not decide eligibility.
      </p>
    </dl>
  );
}

function FindingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--color-cs-text)]">{value}</dd>
    </div>
  );
}
