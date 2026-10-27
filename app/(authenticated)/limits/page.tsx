import { ThresholdsView } from "@/components/thresholds/thresholds-view";
import { loadLimitsHub } from "@/lib/limits/load-hub";

export default async function LimitsPage() {
  const hub = await loadLimitsHub();

  return (
    <div>
      <h1 className="cs-big-title mb-1">Programs</h1>
      <p className="mb-5 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Each card is a program you receive. Open it for that program&apos;s alerts, dates, and limits.
      </p>
      <ThresholdsView beneficiaryId={hub.beneficiaryId} embedded cardsFirst />
    </div>
  );
}
