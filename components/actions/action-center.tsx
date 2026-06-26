import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChevronDown,
  IconExternalLink,
  IconPhone,
} from "@tabler/icons-react";
import type { ReportingAction } from "@/lib/reporting/reporting-actions";

/* ---------------------------------------------------------------------------
 * Action Center: program-aware "what to do" cards. Each detected change shows
 * the obligation for every enrolled program — agency, deadline, and how to
 * report — using native <details> so the how-to expands without client JS.
 * ------------------------------------------------------------------------- */

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActionCenter({ actions }: { actions: ReportingAction[] }) {
  if (actions.length === 0) return null;

  return (
    <section className="cs-card mb-4 overflow-hidden p-0">
      <div className="flex items-center gap-2.5 border-b border-[var(--color-cs-border)] bg-[var(--color-cs-warning-bg)] px-5 py-3.5">
        <IconAlertTriangle size={18} stroke={1.9} className="text-[var(--color-cs-warning)]" aria-hidden />
        <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">
          Action needed
        </h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[12px] font-bold text-[var(--color-cs-warning)]">
          {actions.length}
        </span>
      </div>

      <ul className="divide-y divide-[var(--color-cs-border)]">
        {actions.map((a) => {
          const deadline = formatDeadline(a.deadlineISO);
          return (
            <li key={a.id} className="p-5">
              <h3 className="text-[14px] font-bold text-[var(--color-cs-text)]">{a.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                {a.detail}
              </p>

              <div className="mt-3 space-y-2">
                {a.programs.map((p) => (
                  <details
                    key={p.short}
                    className="group rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px]">
                      <span className="font-semibold text-[var(--color-cs-text)]">
                        Because you receive {p.short}
                      </span>
                      {deadline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--color-cs-brand)]">
                          <IconCalendarDue size={12} stroke={2} aria-hidden /> by {deadline}
                        </span>
                      )}
                      <IconChevronDown
                        size={16}
                        stroke={2}
                        aria-hidden
                        className="ml-auto text-[var(--color-cs-text-muted)] transition-transform group-open:rotate-180"
                      />
                    </summary>

                    <div className="mt-3 space-y-3">
                      <p className="text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                        {p.deadlineNote}
                      </p>
                      <ol className="space-y-1.5">
                        {p.howTo.map((step, i) => (
                          <li key={i} className="flex gap-2 text-[13px] text-[var(--color-cs-text)]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-[11px] font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-snug">{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <a
                          href={p.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cs-btn cs-btn-primary !px-3.5 !py-2 !text-[13px]"
                        >
                          <IconExternalLink size={15} stroke={1.9} aria-hidden /> How to report
                        </a>
                        {p.phone && (
                          <a
                            href={`tel:${p.phone.replace(/[^0-9]/g, "")}`}
                            className="cs-btn cs-btn-secondary !px-3.5 !py-2 !text-[13px]"
                          >
                            <IconPhone size={15} stroke={1.9} aria-hidden /> {p.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-[var(--color-cs-border)] px-5 py-3 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
        Detected from your activity to help you stay on top of reporting. Informational only — not a
        determination of eligibility. When in doubt, confirm with the agency or a benefits counselor.
      </p>
    </section>
  );
}
