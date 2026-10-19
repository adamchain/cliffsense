import { PolicyScreen } from "@/components/policy/policy-screen";
import { loadLimitsHub } from "@/lib/limits/load-hub";

export default async function LimitsPolicyPage() {
  const hub = await loadLimitsHub();

  return (
    <div>
      <h1 className="cs-big-title mb-1">2026–27 policy</h1>
      <p className="mb-5 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Check whether a projected 2026–27 rule applies to this person before treating it as current.
      </p>
      <PolicyScreen beneficiaryId={hub.beneficiaryId} initial={hub.policyScreenInitial} />
    </div>
  );
}
