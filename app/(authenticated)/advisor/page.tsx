import { AdvisorChat } from "./advisor-chat";

export default function AdvisorPage() {
  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Advisor</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">AI advisor</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Ask questions about how thresholds work, what a specific program counts as income, or how
        to read your CliffSense data. The advisor cites general program rules — it does not make
        eligibility determinations.
      </p>
      <div className="mb-3 rounded border border-[var(--color-cs-info-bg)] bg-[var(--color-cs-info-bg)] p-3 text-xs text-[var(--color-cs-info)]">
        <strong>Informational only.</strong> Not a lawyer, financial advisor, or benefits counselor.
        For final determinations, contact your benefits agency.
      </div>
      <AdvisorChat />
    </>
  );
}
