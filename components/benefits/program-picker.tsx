"use client";

import { programLabel } from "@/lib/benefits/program-meta";
import { PROGRAM_GROUPS, UNGROUPED_PROGRAMS, type Program } from "@/lib/programs";

function Toggle({
  program,
  on,
  onToggle,
}: {
  program: Program;
  on: boolean;
  onToggle: (program: Program) => void;
}) {
  return (
    <button
      key={program}
      type="button"
      onClick={() => onToggle(program)}
      aria-pressed={on}
      className={`rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
        on
          ? "border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] py-[7px] text-[var(--color-cs-brand)]"
          : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)]"
      }`}
    >
      <span className="block">{programLabel(program)}</span>
    </button>
  );
}

export function ProgramPicker({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (program: Program) => void;
}) {
  return (
    <div className="space-y-5">
      {PROGRAM_GROUPS.map((group) => (
        <div key={group.id}>
          <h4 className="mb-0.5 text-[13px] font-semibold text-[var(--color-cs-text)]">{group.label}</h4>
          <p className="mb-2 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">{group.hint}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.programs.map((p) => (
              <Toggle key={p} program={p} on={selected.has(p)} onToggle={onToggle} />
            ))}
          </div>
        </div>
      ))}
      <div>
        <h4 className="mb-2 text-[13px] font-semibold text-[var(--color-cs-text)]">Other programs</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {UNGROUPED_PROGRAMS.map((p) => (
            <Toggle key={p} program={p} on={selected.has(p)} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  );
}
