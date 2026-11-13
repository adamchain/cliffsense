import Link from "next/link";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import type { ExpenseSummary, RecurringFrequency } from "@/lib/transactions/recurring-expenses";

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function RecurringExpensesCard({
  summary,
  irweAuto,
}: {
  summary: ExpenseSummary;
  irweAuto: boolean;
}) {
  if (summary.recurring.length === 0 && summary.workRelatedMonthlyCents <= 0) return null;

  return (
    <section
      className="mb-4 rounded-[18px] bg-[var(--color-cs-brand-soft)] p-4"
      aria-label="Recurring expenses"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[var(--color-cs-text)]">Recurring expenses</h2>
        {summary.recurringMonthlyCents > 0 ? (
          <span className="text-[15px] font-bold tabular-nums text-[var(--color-cs-text)]">
            {formatPlainUsdFromCents(summary.recurringMonthlyCents)}/mo
          </span>
        ) : null}
      </div>
      {summary.recurring.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {summary.recurring.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-3 rounded-[14px] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-[var(--color-cs-text)]">
                  {item.label}
                </div>
                <div className="mt-0.5 text-[12px] text-[var(--color-cs-text-secondary)]">
                  {FREQUENCY_LABEL[item.frequency]} · {item.count} charges
                  {item.category ? ` · ${item.category}` : ""}
                </div>
                {item.workRelated ? (
                  <div className="mt-1 text-[11px] font-semibold text-[var(--color-cs-brand)]">
                    Work expense
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[14px] font-semibold tabular-nums text-[var(--color-cs-text)]">
                  {formatPlainUsdFromCents(item.monthlyAmountCents)}/mo
                </div>
                <div className="text-[12px] text-[var(--color-cs-text-muted)]">
                  {formatPlainUsdFromCents(item.averageAmountCents)} each
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {summary.workRelatedMonthlyCents > 0 ? (
        <p className="mt-3 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
          Work expenses (IRWE){" "}
          <span className="font-semibold text-[var(--color-cs-text)]">
            {formatPlainUsdFromCents(summary.workRelatedMonthlyCents)}
          </span>{" "}
          a month
          {summary.workRelatedNote ? ` from ${summary.workRelatedNote}` : ""}.{" "}
          {irweAuto ? "That amount is in the work expense field on " : "Review it in the work expense field on "}
          <Link href="/limits" className="font-semibold text-[var(--color-cs-brand)]">
            Programs
          </Link>
          .{" "}
          SSA decides which receipts qualify.
        </p>
      ) : null}
    </section>
  );
}
