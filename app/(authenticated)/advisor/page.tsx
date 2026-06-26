import { AdvisorChat } from "./advisor-chat";

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ ask?: string }>;
}) {
  const { ask } = await searchParams;
  const initialQuestion = typeof ask === "string" ? ask.slice(0, 500) : undefined;
  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Advisor</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">AI advisor</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Ask about how thresholds work, what a program counts as income, or your own numbers. The
        advisor can see your linked accounts — this month&apos;s income (earned vs unearned),
        balances, categories, and limit status — so it answers from your real figures. It cites
        general program rules and does not make eligibility determinations.
      </p>
      <div className="mb-3 rounded border border-[var(--color-cs-info-bg)] bg-[var(--color-cs-info-bg)] p-3 text-xs text-[var(--color-cs-info)]">
        <strong>Informational only.</strong> Not a lawyer, financial advisor, or benefits counselor.
        For final determinations, contact your benefits agency.
      </div>
      <AdvisorChat initialQuestion={initialQuestion} />
    </>
  );
}
