import { ThresholdsView } from "@/components/thresholds/thresholds-view";
import { WorkPlanner } from "@/components/benefits/work-planner";
import { loadLimitsHub } from "@/lib/limits/load-hub";

export default async function LimitsPage() {
  const hub = await loadLimitsHub();

  return (
    <div>
      <h1 className="cs-big-title mb-1">Limits</h1>
      <p className="mb-5 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Reference limits for the programs you receive. Alerts, 2026–27 policy, and programs each have their own page.
      </p>
      <ThresholdsView beneficiaryId={hub.beneficiaryId} embedded />
      <WorkPlanner beneficiaryId={hub.beneficiaryId} initialTwpMonths={hub.twpMonthsUsed} />
    </div>
  );
}
