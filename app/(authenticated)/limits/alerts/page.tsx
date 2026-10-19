import { AlertsView } from "@/components/alerts/alerts-view";
import { loadLimitsHub } from "@/lib/limits/load-hub";

export default async function LimitsAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ alert?: string }>;
}) {
  const [{ alert }, hub] = await Promise.all([searchParams, loadLimitsHub()]);

  return (
    <div>
      <h1 className="cs-big-title mb-1">Alerts</h1>
      <p className="mb-5 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Each alert shows the amount, the transactions or balances in that amount, and what to do for that program.
      </p>
      <AlertsView
        beneficiaryId={hub.beneficiaryId}
        reportingActions={hub.reportingActions}
        limitSources={hub.limitSources}
        focusAlertId={typeof alert === "string" ? alert : null}
        embedded
      />
    </div>
  );
}
