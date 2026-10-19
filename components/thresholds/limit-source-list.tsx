import { formatPlainUsdFromCents } from "@/lib/format/money";
import { linesForLimit, type LimitSources } from "@/lib/thresholds/limit-sources";

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function LimitSourceList({
  sources,
  thresholdType,
  program,
}: {
  sources: LimitSources | null | undefined;
  thresholdType: string | null | undefined;
  program?: string | null;
}) {
  if (!sources || !thresholdType) return null;
  const view = linesForLimit(sources, thresholdType, program);
  const included = view.lines.filter((line) => line.included);
  const leftOut = view.lines.filter((line) => !line.included);

  return (
    <div className="mt-3 overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="border-b border-[var(--color-cs-sep)] px-4 py-3">
        <h3 className="text-[15px] font-semibold text-[var(--color-cs-text)]">{view.heading}</h3>
        <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">{view.detail}</p>
      </div>
      {view.lines.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-[var(--color-cs-text-secondary)]">
          Nothing in the linked accounts is in this total yet.
        </p>
      ) : (
        <ul>
          {[...included, ...leftOut].map((line) => (
            <li
              key={line.id}
              className="flex items-center gap-3 border-b border-[var(--color-cs-sep)] px-4 py-2 last:border-b-0"
            >
              <div className="w-12 shrink-0 text-[12px] text-[var(--color-cs-text-muted)]">
                {line.date ? formatDay(line.date) : "Bal."}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-[var(--color-cs-text)]">{line.name}</div>
                {line.note && (
                  <div className="truncate text-[11.5px] text-[var(--color-cs-text-secondary)]">{line.note}</div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[14px] font-semibold tabular-nums text-[var(--color-cs-text)]">
                  {formatPlainUsdFromCents(line.amountCents)}
                </div>
                <div className="text-[11px] text-[var(--color-cs-text-muted)]">
                  {line.included ? "Included" : "Left out"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
