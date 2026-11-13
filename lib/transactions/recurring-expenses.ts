/**
 * Repeating bills and the monthly work-expense estimate derived from them.
 * Used for imported statements as well as Plaid rows, since both land in the
 * same transaction collection once they are categorized as expenses.
 */

export type ExpenseInput = {
  id: string;
  date: string;
  amountCents: number;
  name: string;
  merchantName: string;
  category: string;
};

export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

export type RecurringExpense = {
  key: string;
  label: string;
  category: string;
  frequency: RecurringFrequency;
  count: number;
  averageAmountCents: number;
  monthlyAmountCents: number;
  lastDate: string;
  workRelated: boolean;
  transactionIds: string[];
};

export type ExpenseSummary = {
  recurring: RecurringExpense[];
  recurringMonthlyCents: number;
  workRelatedMonthlyCents: number;
  workRelatedLabels: string[];
  workRelatedNote: string;
};

const DAYS_PER_MONTH = 30.4375;
const MIN_SPAN_DAYS = 28;

/** Bills we treat as repeating even when the amount moves a little (utilities). */
const BILL_RE =
  /\b(hous(?:e|ing)|rent|lease|mortgage|utilit(?:y|ies)|electric|water|sewer|phone|mobile|wireless|internet|cable|wi-?fi|subscription|transport(?:ation)?|transit|septa|insurance|loan|tuition)\b/i;

/**
 * Costs SSA may count as impairment-related work expenses: getting to work,
 * and medication or other medical costs. Household bills are not included.
 */
const WORK_RE =
  /\b(transport(?:ation)?|transit|septa|gas|fuel|pharmacy|pharmacies|prescription|medical|medicine|medication|\brx\b)\b/i;

const PER_MONTH: Record<RecurringFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
};

function daysBetween(earlier: string, later: string): number {
  const [ay, am, ad] = earlier.split("-").map(Number);
  const [by, bm, bd] = later.split("-").map(Number);
  if (!ay || !am || !ad || !by || !bm || !bd) return 0;
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function displayLabel(row: ExpenseInput): string {
  const merchant = row.merchantName.replace(/\s+/g, " ").trim();
  const name = row.name.replace(/\s+/g, " ").trim();
  return merchant || name || "Expense";
}

export function recurringPayeeKey(name: string, merchantName: string): string {
  const raw = (merchantName || name || "").toUpperCase();
  return raw
    .replace(/#\s*\d+/g, " ")
    .replace(/[^A-Z0-9 &]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isWorkRelatedExpense(row: Pick<ExpenseInput, "name" | "merchantName" | "category">): boolean {
  return WORK_RE.test(`${row.name} ${row.merchantName} ${row.category}`);
}

function withinRatio(amounts: number[], ratio: number): boolean {
  const mid = median(amounts);
  if (mid <= 0) return false;
  return amounts.every((amount) => Math.abs(amount - mid) / mid <= ratio);
}

function frequencyForGap(days: number): RecurringFrequency {
  if (days < 11) return "weekly";
  if (days < 20) return "biweekly";
  return "monthly";
}

export function formatWorkExpenseNote(labels: string[]): string {
  const shown = labels.slice(0, 4);
  const extra = labels.length - shown.length;
  if (shown.length === 0) return "";
  if (shown.length === 1) return extra > 0 ? `${shown[0]} and ${extra} more` : shown[0];
  if (shown.length === 2 && extra === 0) return `${shown[0]} and ${shown[1]}`;
  const base = `${shown.slice(0, -1).join(", ")}, and ${shown[shown.length - 1]}`;
  return extra > 0 ? `${base}, and ${extra} more` : base;
}

/** True when Money may replace the stored work-expense amount. */
export function irweSourceAllowsAuto(source: string, storedCents: number): boolean {
  if (source === "manual") return false;
  if (source === "auto") return true;
  return storedCents <= 0;
}

function workRelatedMonthly(rows: ExpenseInput[]): { monthlyCents: number; labels: string[] } {
  const work = rows.filter((row) => row.amountCents > 0 && isWorkRelatedExpense(row) && row.date);
  if (work.length < 2) return { monthlyCents: 0, labels: [] };
  const dates = work.map((row) => row.date).sort();
  const span = Math.max(MIN_SPAN_DAYS, daysBetween(dates[0] ?? "", dates[dates.length - 1] ?? ""));
  const sum = work.reduce((total, row) => total + row.amountCents, 0);
  const byLabel = new Map<string, number>();
  for (const row of work) {
    const label = displayLabel(row);
    byLabel.set(label, (byLabel.get(label) ?? 0) + row.amountCents);
  }
  const labels = [...byLabel.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label]) => label);
  return { monthlyCents: Math.round((sum * DAYS_PER_MONTH) / span), labels };
}

/**
 * Groups expense rows into repeating bills and a monthly work-expense estimate.
 * A bill repeats when the same payee shows up at least twice, 6–40 days apart,
 * at a similar amount. Utilities and other named bills can move up to 20%.
 * Other payees have to stay within 8%, so a grocery run is not listed as a bill.
 */
export function summarizeExpenses(rows: ExpenseInput[]): ExpenseSummary {
  const groups = new Map<string, ExpenseInput[]>();
  for (const row of rows) {
    if (row.amountCents <= 0 || !row.date) continue;
    const key = recurringPayeeKey(row.name, row.merchantName);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const recurring: RecurringExpense[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const gaps: number[] = [];
    for (let i = 1; i < ordered.length; i += 1) {
      gaps.push(daysBetween(ordered[i - 1]?.date ?? "", ordered[i]?.date ?? ""));
    }
    const gap = median(gaps);
    if (gap < 6 || gap > 40) continue;

    const amounts = ordered.map((row) => row.amountCents);
    const blob = ordered.map((row) => `${row.name} ${row.merchantName} ${row.category}`).join(" ");
    const bill = BILL_RE.test(blob);
    if (!withinRatio(amounts, bill ? 0.2 : 0.08)) continue;

    const frequency = frequencyForGap(gap);
    const averageAmountCents = Math.round(amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length);
    const latest = ordered[ordered.length - 1];
    recurring.push({
      key,
      label: displayLabel(latest ?? ordered[0]!),
      category: (latest?.category ?? "").trim(),
      frequency,
      count: ordered.length,
      averageAmountCents,
      monthlyAmountCents: Math.round(averageAmountCents * PER_MONTH[frequency]),
      lastDate: latest?.date ?? "",
      workRelated: isWorkRelatedExpense({
        name: blob,
        merchantName: "",
        category: "",
      }),
      transactionIds: ordered.map((row) => row.id),
    });
  }

  recurring.sort(
    (a, b) => b.monthlyAmountCents - a.monthlyAmountCents || a.label.localeCompare(b.label),
  );

  const work = workRelatedMonthly(rows);
  return {
    recurring,
    recurringMonthlyCents: recurring.reduce((sum, item) => sum + item.monthlyAmountCents, 0),
    workRelatedMonthlyCents: work.monthlyCents,
    workRelatedLabels: work.labels,
    workRelatedNote: formatWorkExpenseNote(work.labels),
  };
}
