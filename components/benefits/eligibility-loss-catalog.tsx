import {
  ELIGIBILITY_LOSS_SCENARIOS,
  type ScenarioAlertTrigger,
} from "@/lib/alerts/eligibility-loss-scenarios";

const TRIGGER_LABEL: Record<ScenarioAlertTrigger, string> = {
  cliff: "Cliff",
  reporting: "Reporting",
  snt: "SNT",
  able: "ABLE",
};

/** Reference list of eligibility-loss warning scenarios (auto + educational). */
export function EligibilityLossCatalog() {
  const auto = ELIGIBILITY_LOSS_SCENARIOS.filter((s) => s.autoDetect);
  const manual = ELIGIBILITY_LOSS_SCENARIOS.filter((s) => !s.autoDetect);

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">
        Eligibility-loss warning scenarios ({ELIGIBILITY_LOSS_SCENARIOS.length})
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Warning types beyond basic limit bars — cliffs, reporting clocks, SNT payment effects, and ABLE
        suspension risk.{" "}
        <span className="font-medium text-[var(--color-cs-text)]">{auto.length} auto-detect</span> from
        linked activity; the rest are reference warnings you can opt into under Settings → alert types.
      </p>

      <ScenarioTable title="Auto-detected from account activity" rows={auto} />
      <ScenarioTable title="Reference / manual awareness" rows={manual} />
    </section>
  );
}

function ScenarioTable({
  title,
  rows,
}: {
  title: string;
  rows: typeof ELIGIBILITY_LOSS_SCENARIOS;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-medium text-[var(--color-cs-text)]">{title}</h3>
      <div className="mt-2 overflow-x-auto rounded border border-[var(--color-cs-border)] bg-white">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-[11px] uppercase tracking-wide text-[var(--color-cs-text-muted)]">
              <th className="px-3 py-2 font-medium">Scenario</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Programs</th>
              <th className="px-3 py-2 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-cs-border)] last:border-0 align-top">
                <td className="px-3 py-2 font-medium text-[var(--color-cs-text)]">{s.title}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--color-cs-text-secondary)]">
                  {TRIGGER_LABEL[s.trigger]}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--color-cs-text-secondary)]">
                  {s.programs.join(", ")}
                </td>
                <td className="px-3 py-2 text-[var(--color-cs-text-secondary)]">{s.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
