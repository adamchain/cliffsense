"use client";

import { useMemo, useState } from "react";
import {
  CLOSURE_CODE_NOTES,
  ELIGIBILITY_LOSS_PERSONAS,
  PERSONA_GROUP_LABEL,
  type LossPersonaGroup,
} from "@/lib/alerts/eligibility-loss-personas";
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

const GROUPS: LossPersonaGroup[] = ["procedural", "substantive", "hybrid", "policy"];

/** Reference list of eligibility-loss warning scenarios (personas + auto-detect cliffs). */
export function EligibilityLossCatalog() {
  const auto = ELIGIBILITY_LOSS_SCENARIOS.filter((s) => s.autoDetect);
  const [activeId, setActiveId] = useState(ELIGIBILITY_LOSS_PERSONAS[0]?.id ?? "");
  const [groupFilter, setGroupFilter] = useState<LossPersonaGroup | "all">("all");

  const visible = useMemo(
    () =>
      groupFilter === "all"
        ? ELIGIBILITY_LOSS_PERSONAS
        : ELIGIBILITY_LOSS_PERSONAS.filter((s) => s.group === groupFilter),
    [groupFilter],
  );

  const active =
    visible.find((s) => s.id === activeId) ?? visible[0] ?? ELIGIBILITY_LOSS_PERSONAS[0];

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">
        30 beneficiary eligibility-loss scenarios
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Prevention examples for product design and beneficiary education. Each alert is an action
        plan: threatened program, triggering rule, documents, next category, and appeal / continued-
        benefit deadlines. These are not claims that every DHS closure was avoidable, and they are
        not individual eligibility determinations. Final 2026–2027 policy dates must be verified
        before giving case-specific instructions.
      </p>

      <div className="mt-3 rounded border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        <p className="font-medium text-[var(--color-cs-text)]">DHS closure codes (clarified)</p>
        <p className="mt-1">
          A closure-code entry is a recorded benefit-budget/case action, not necessarily a unique
          person or permanent loss.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-[var(--color-cs-text)]">042.</span> {CLOSURE_CODE_NOTES["042"]}
          </li>
          <li>
            <span className="font-medium text-[var(--color-cs-text)]">440.</span> {CLOSURE_CODE_NOTES["440"]}
          </li>
          <li>
            <span className="font-medium text-[var(--color-cs-text)]">474.</span> {CLOSURE_CODE_NOTES["474"]}
          </li>
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGroupFilter("all")}
          className={`rounded-sm border px-2.5 py-1.5 text-[12px] ${
            groupFilter === "all"
              ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] font-medium text-[var(--color-cs-text)]"
              : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)]"
          }`}
        >
          All 30
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGroupFilter(g);
              const first = ELIGIBILITY_LOSS_PERSONAS.find((s) => s.group === g);
              if (first) setActiveId(first.id);
            }}
            className={`rounded-sm border px-2.5 py-1.5 text-[12px] ${
              groupFilter === g
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] font-medium text-[var(--color-cs-text)]"
                : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)]"
            }`}
          >
            {PERSONA_GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {visible.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={`rounded-sm border px-2.5 py-1.5 text-left text-[12px] ${
              active?.id === s.id
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] font-medium text-[var(--color-cs-text)]"
                : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            }`}
          >
            {s.n}. {s.persona}
          </button>
        ))}
      </div>

      {active && (
        <article className="mt-3 rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            {active.n} · {PERSONA_GROUP_LABEL[active.group]}
          </p>
          <h3 className="mt-1 font-medium text-[var(--color-cs-text)]">
            {active.persona} — {active.title}
          </h3>
          <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
            Benefits: {active.programs.join(", ")}
          </p>
          <p className="mt-3 leading-relaxed text-[var(--color-cs-text-secondary)]">
            <span className="font-medium text-[var(--color-cs-text)]">Trigger. </span>
            {active.trigger}
          </p>
          <p className="mt-2 leading-relaxed text-[var(--color-cs-text-secondary)]">
            <span className="font-medium text-[var(--color-cs-text)]">Likely consequence. </span>
            {active.consequence}
          </p>
          <p className="mt-2 leading-relaxed text-[var(--color-cs-text-secondary)]">
            <span className="font-medium text-[var(--color-cs-text)]">Classification. </span>
            {active.classification}
          </p>
          {active.slideReason && (
            <p className="mt-2 leading-relaxed text-[var(--color-cs-text-secondary)]">
              <span className="font-medium text-[var(--color-cs-text)]">Policy source. </span>
              {active.slideReason}
            </p>
          )}

          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Exact options to prevent or cure the loss
          </p>
          <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-[var(--color-cs-text-secondary)]">
            {active.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      )}

      <h3 className="mt-8 text-[13px] font-medium text-[var(--color-cs-text)]">
        Auto-detected from account activity ({auto.length})
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Limit-based cliffs evaluated from linked wages and balances.{" "}
        {ELIGIBILITY_LOSS_SCENARIOS.length - auto.length} additional reference warnings can be opted
        into under Settings → alert types.
      </p>
      <ScenarioTable title="Live monitoring" rows={auto} />
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
    <div className="mt-2">
      <h4 className="sr-only">{title}</h4>
      <div className="overflow-x-auto rounded border border-[var(--color-cs-border)] bg-white">
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
