"use client";

import { useMemo, useState } from "react";
import {
  formatUsdCents,
  statusFromPercent,
  statusWord,
  type LimitStatus,
} from "@/lib/benefits/program-tier";

const FILL: Record<LimitStatus, string> = {
  ok: "f-ok bg-[var(--color-cs-accent-green)]",
  warn: "f-warn bg-[var(--color-cs-accent-orange)]",
  crit: "f-crit bg-[#ff3b30]",
};
const AMT: Record<LimitStatus, string> = {
  ok: "text-[var(--color-cs-success)]",
  warn: "text-[var(--color-cs-warning)]",
  crit: "text-[var(--color-cs-danger)]",
};

export function LimitWhatIf({
  programLabel,
  currentCents,
  limitCents,
  warnAtPercent = 85,
}: {
  programLabel: string;
  currentCents: number;
  limitCents: number;
  warnAtPercent?: number;
}) {
  const [deltaCents, setDeltaCents] = useState(0);
  const min = -Math.min(currentCents, 80_000);
  const max = 120_000;

  const projected = Math.max(0, currentCents + deltaCents);
  const pct = limitCents > 0 ? Math.round((projected / limitCents) * 100) : 0;
  const sc = statusFromPercent(pct, warnAtPercent);
  const cushion = limitCents - projected;

  const note = useMemo(() => {
    if (sc === "crit") {
      return `This would put ${programLabel} over its limit — eligibility could pause. Move funds to ABLE or offset with a deduction.`;
    }
    if (sc === "warn") {
      return `${programLabel} would be close to its limit. Report the change promptly and keep documentation.`;
    }
    return `${programLabel} stays comfortably eligible with this change.`;
  }, [programLabel, sc]);

  const deltaLabel =
    deltaCents === 0
      ? `No change · projected ${formatUsdCents(projected)}`
      : `${deltaCents > 0 ? "+" : "−"}${formatUsdCents(Math.abs(deltaCents))} → ${formatUsdCents(projected)} (${pct}%)`;

  return (
    <div className="mt-3.5 rounded-[18px] bg-[var(--color-cs-card)] px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[16px] font-bold text-[var(--color-cs-text)]">What if…</div>
        <button
          type="button"
          className="text-[15px] text-[var(--color-cs-brand)]"
          onClick={() => setDeltaCents(0)}
        >
          Reset
        </button>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        Drag to try a change — add or remove dollars — and see where this limit lands.
      </p>
      <input
        type="range"
        className="mt-4 mb-1.5 w-full accent-[var(--color-cs-brand)]"
        min={min}
        max={max}
        step={1000}
        value={deltaCents}
        onChange={(e) => setDeltaCents(Number(e.target.value))}
        aria-label="Simulate change"
      />
      <div className="mb-2.5 text-center text-[13.5px] font-semibold tabular-nums text-[var(--color-cs-text)]">
        {deltaLabel}
      </div>
      <div className="my-3 h-px bg-[var(--color-cs-sep)]" />
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[14px] font-medium text-[var(--color-cs-text-secondary)]">
          {cushion >= 0 ? "Cushion to limit" : "Over the limit"}
        </div>
        <div className={`text-[17px] font-bold tabular-nums ${AMT[sc]}`}>
          {cushion >= 0
            ? `${formatUsdCents(cushion)} left`
            : `${formatUsdCents(-cushion)} over`}
        </div>
      </div>
      <div className="my-3 h-2 overflow-hidden rounded-lg bg-[rgba(120,120,128,0.18)]">
        <div
          className={`h-full rounded-lg transition-[width] duration-150 ${FILL[sc]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        {note}{" "}
        <span className="font-medium text-[var(--color-cs-text)]">
          ({statusWord(sc)})
        </span>
      </p>
    </div>
  );
}
