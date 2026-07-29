"use client";

import { useState } from "react";
import { SALARY_SNT_SCENARIOS } from "@/lib/benefits/salary-snt-scenarios";

/** Interactive walkthrough of wage-change × SNT-disbursement reporting paths. */
export function SalarySntScenarios() {
  const [activeId, setActiveId] = useState(SALARY_SNT_SCENARIOS[0]?.id ?? "");
  const active = SALARY_SNT_SCENARIOS.find((s) => s.id === activeId) ?? SALARY_SNT_SCENARIOS[0];

  if (!active) return null;

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">
        Salary increase + SNT disbursement — reporting scenarios
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Wage changes and trust payouts interact. Pick a scenario to see SSI vs SSDI impact and the
        reporting steps for SSA and COMPASS/CAO. Informational only.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {SALARY_SNT_SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={`rounded-sm border px-2.5 py-1.5 text-left text-[12px] ${
              activeId === s.id
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] font-medium text-[var(--color-cs-text)]"
                : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            }`}
          >
            {i + 1}. {s.title.replace(/^\d+\.\s*/, "").slice(0, 42)}
            {s.title.replace(/^\d+\.\s*/, "").length > 42 ? "…" : ""}
          </button>
        ))}
      </div>

      <article className="mt-3 rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px]">
        <h3 className="font-medium text-[var(--color-cs-text)]">{active.title}</h3>
        <p className="mt-2 text-[var(--color-cs-text-secondary)]">{active.setup}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-[var(--color-cs-surface)] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
              SSI impact
            </p>
            <p className="mt-1 leading-relaxed text-[var(--color-cs-text-secondary)]">{active.ssiImpact}</p>
          </div>
          <div className="rounded-md bg-[var(--color-cs-surface)] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
              SSDI / DAC impact
            </p>
            <p className="mt-1 leading-relaxed text-[var(--color-cs-text-secondary)]">{active.ssdiImpact}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Reporting steps
          </p>
          <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-[var(--color-cs-text-secondary)]">
            {active.reportingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            File in Vault
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--color-cs-text-secondary)]">
            {active.vaultTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}
