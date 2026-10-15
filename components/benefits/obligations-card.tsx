import Link from "next/link";
import { calendarEventHref } from "@/lib/calendar/event-id";
import {
  DATE_CONFIDENCE_LABEL,
  OBLIGATION_CATEGORY_LABEL,
  RENEWAL_IS_ONE_DEADLINE,
  SNAP_CATEGORY_RULES,
  summarizeProgramObligations,
  type DateConfidence,
  type ObligationRow,
  type SnapReportingCategory,
} from "@/lib/reporting/obligations";

const CONFIDENCE_TONE: Record<DateConfidence, string> = {
  confirmed: "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]",
  estimated: "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]",
  needs_confirmation: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
};

export function ConfidenceBadge({ confidence }: { confidence: DateConfidence }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${CONFIDENCE_TONE[confidence]}`}
    >
      {DATE_CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DateLine({ row }: { row: ObligationRow }) {
  return (
    <Link
      href={calendarEventHref({ source: "user", deadlineId: row.id })}
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-semibold text-[var(--color-cs-text)] hover:underline"
    >
      <span>
        {shortDate(row.dueDate)} · {row.title}
      </span>
      <ConfidenceBadge confidence={row.confidence} />
      {row.hasSourceDocument && (
        <span className="text-[11px] font-normal text-[var(--color-cs-text-secondary)]">
          Notice attached
        </span>
      )}
    </Link>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--color-cs-sep)] px-4 py-3 first:border-t-0">
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
        {label}
      </div>
      {children}
    </div>
  );
}

const muted = "text-[13px] leading-snug text-[var(--color-cs-text-secondary)]";

/**
 * Separate dates for one benefit: next renewal or review, next interim report,
 * changes to report and when, and documents the agency requested. The soonest
 * of these is called out so a far-off renewal cannot hide it.
 */
export function ObligationsCard({
  program,
  rows,
  snapCategory,
}: {
  program: string;
  rows: ObligationRow[];
  snapCategory?: SnapReportingCategory | null;
}) {
  const s = summarizeProgramObligations(program, rows, { snapCategory });
  const rule = s.rule;
  const snapRule = s.code === "SNAP" ? SNAP_CATEGORY_RULES[snapCategory ?? "unknown"] : null;

  return (
    <div className="mb-5">
      <div className="mb-2 px-0.5">
        <h2 className="text-[22px] font-bold tracking-tight">What&apos;s due</h2>
        <p className={`mt-1 ${muted}`}>{RENEWAL_IS_ONE_DEADLINE}</p>
      </div>

      {s.earlierThanRenewal && s.earliest && (
        <div className="mb-2 rounded-[14px] bg-[var(--color-cs-warning-bg)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-cs-text)]">
          Due before your renewal: {s.earliest.title} on {shortDate(s.earliest.dueDate)}.
        </div>
      )}
      {s.discrepancies.map((d) => (
        <div
          key={d}
          className="mb-2 rounded-[14px] bg-[var(--color-cs-warning-bg)] px-4 py-2.5 text-[13px] text-[var(--color-cs-text)]"
        >
          {d}
        </div>
      ))}

      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <Section label={OBLIGATION_CATEGORY_LABEL.renewal_review}>
          {s.nextRenewal ? (
            <DateLine row={s.nextRenewal} />
          ) : (
            <p className={muted}>
              Not set.{" "}
              <Link href="/limits#programs" className="text-[var(--color-cs-brand)]">
                Add the date from your notice
              </Link>
              .
            </p>
          )}
          {rule && rule.reviews.length > 0 && (
            <ul className={`mt-1.5 space-y-1 ${muted}`}>
              {rule.reviews.map((r) => (
                <li key={r.label}>
                  <span className="font-medium text-[var(--color-cs-text)]">{r.label}:</span>{" "}
                  {r.frequency}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section label={OBLIGATION_CATEGORY_LABEL.interim_report}>
          {s.nextInterim ? (
            <DateLine row={s.nextInterim} />
          ) : s.interimExpected === false ? (
            <p className={muted}>No scheduled report between renewals for this program.</p>
          ) : (
            <p className={muted}>
              {s.interimExpected ? "A report is due between renewals — " : ""}
              Not set. Check your notice and{" "}
              <Link href="/limits#programs" className="text-[var(--color-cs-brand)]">
                add the date
              </Link>
              . This date is never worked out from your renewal date.
            </p>
          )}
          {rule?.interim && <p className={`mt-1 ${muted}`}>{rule.interim.frequency}</p>}
          {snapRule && (
            <p className={`mt-1 ${muted}`}>
              <span className="font-medium text-[var(--color-cs-text)]">{snapRule.label}.</span>{" "}
              {snapRule.interimNote}
            </p>
          )}
        </Section>

        <Section label={OBLIGATION_CATEGORY_LABEL.change_report}>
          {rule ? (
            <p className={muted}>
              <span className="font-medium text-[var(--color-cs-text)]">
                {rule.changeReporting.deadline}.
              </span>{" "}
              {rule.changeReporting.what}
            </p>
          ) : (
            <p className={muted}>Check the program&apos;s rules for changes you must report.</p>
          )}
          {s.changeReportsDue.map((r) => (
            <div key={r.id} className="mt-1.5">
              <DateLine row={r} />
            </div>
          ))}
        </Section>

        <Section label={OBLIGATION_CATEGORY_LABEL.document_request}>
          {s.documentsDue.length === 0 ? (
            <p className={muted}>
              None recorded. When the agency asks for proof, add it on the{" "}
              <Link href="/calendar" className="text-[var(--color-cs-brand)]">
                Calendar
              </Link>{" "}
              as &ldquo;Documents requested&rdquo; with its own due date.
            </p>
          ) : (
            <div className="space-y-1.5">
              {s.documentsDue.map((r) => (
                <DateLine key={r.id} row={r} />
              ))}
            </div>
          )}
        </Section>

        {rule && rule.linked.length > 0 && (
          <Section label="Linked benefits">
            <ul className={`space-y-1 ${muted}`}>
              {rule.linked.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Section>
        )}

        {rule && (
          <Section label="Sources">
            <ul className={`space-y-1 ${muted}`}>
              {rule.sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-cs-brand)] hover:underline"
                  >
                    {src.label}
                  </a>
                  {src.effective ? ` · effective ${src.effective}` : ""} · checked {src.checkedOn}
                  {src.needsConfirmation ? " · needs confirmation" : ""}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
