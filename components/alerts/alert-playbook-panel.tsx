import { IconChevronDown } from "@tabler/icons-react";
import {
  INFORMATIONAL_ONLY,
  closureCodeNotes,
  playbookPersonaSteps,
  type AlertPlaybook,
} from "@/lib/alerts/alert-playbook";

export function AlertPlaybookPanel({ playbook }: { playbook: AlertPlaybook }) {
  const steps = playbookPersonaSteps(playbook);
  const codes = closureCodeNotes(playbook);
  const programs = playbook.programs.length ? playbook.programs.join(", ") : "Enrolled programs";

  return (
    <details className="group mt-3 rounded-xl border border-[var(--color-cs-border)] bg-white/70 px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-[var(--color-cs-text)]">
        What to do
        <IconChevronDown
          size={16}
          stroke={2}
          aria-hidden
          className="ml-auto text-[var(--color-cs-text-muted)] transition-transform group-open:rotate-180"
        />
      </summary>
      <dl className="mt-3 space-y-2.5 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        <PlaybookField label="1. Threatened program" value={programs} />
        <PlaybookField label="2. Triggering rule" value={playbook.triggeringRule} />
        <PlaybookField label="3. Deadline / effective date" value={playbook.effectiveDateNote} />
        <PlaybookField label="4. Action that cures or limits the loss" value={playbook.cureAction} />
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            5. Documents
          </dt>
          <dd className="mt-1">
            <ul className="list-disc space-y-0.5 pl-4">
              {playbook.documents.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </dd>
        </div>
        <PlaybookField label="6. If this category cannot continue" value={playbook.alternativePathway} />
        <PlaybookField label="7. Appeal / continued benefits" value={playbook.appealNote} />
      </dl>
      {steps.length > 0 && (
        <div className="mt-3 border-t border-[var(--color-cs-sep)] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Step-by-step plan
          </p>
          <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {codes.length > 0 && (
        <div className="mt-3 rounded-lg bg-[var(--color-cs-surface)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          <p className="font-semibold text-[var(--color-cs-text)]">DHS closure codes</p>
          <ul className="mt-1 space-y-1">
            {codes.map((c) => (
              <li key={c.code}>
                <span className="font-medium text-[var(--color-cs-text)]">{c.code}.</span> {c.note}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">{INFORMATIONAL_ONLY}</p>
    </details>
  );
}

function PlaybookField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--color-cs-text-secondary)]">{value}</dd>
    </div>
  );
}
