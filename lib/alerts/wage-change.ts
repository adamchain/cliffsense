import { snapGross130Cents } from "@/lib/benefits/snap-limits";
import { utcMonthPrefix } from "@/lib/thresholds/metrics";

export { snapGross130Cents } from "@/lib/benefits/snap-limits";

const MIN_NEW_WORK_CENTS = 50_00;
const MIN_PAYCHECK_DELTA_CENTS = 100_00;
const PAYCHECK_RATIO = 1.1;
/** Don't call a quiet month "stopped work" until most of the month has passed. */
const STOPPED_WORK_DAY = 21;

export type WageChangeKind = "new_work" | "increase" | "decrease" | "stopped";

export type WageDeposit = {
  /** YYYY-MM-DD */
  date: string;
  /** Positive net cents. */
  amountCents: number;
  payerKey: string;
};

export function priorMonthPrefix(monthPrefix: string): string {
  const [y, m] = monthPrefix.split("-").map(Number);
  if (!y || !m) return monthPrefix;
  return utcMonthPrefix(new Date(Date.UTC(y, m - 2, 15))).prefix;
}

/**
 * Compare paychecks, not month totals. A 3-paycheck month against a 2-paycheck
 * month is not a raise when the average check is unchanged. A new payer, a
 * return to work, a smaller check, and a month with no pay after the 21st are
 * separate signals.
 */
export function detectWageChange(input: {
  monthPrefix: string;
  deposits: WageDeposit[];
  now: Date;
  /** Account already had transactions before this month, wages or otherwise. */
  hasHistoryBeforeMonth?: boolean;
}): WageChangeKind | null {
  const priorPrefix = priorMonthPrefix(input.monthPrefix);
  const current = input.deposits.filter((d) => d.date.startsWith(input.monthPrefix));
  const prior = input.deposits.filter((d) => d.date.startsWith(priorPrefix));
  const older = input.deposits.filter((d) => d.date.slice(0, 7) < input.monthPrefix);
  const olderPayers = new Set(older.map((d) => d.payerKey).filter(Boolean));
  const hasHistory = input.hasHistoryBeforeMonth ?? older.length > 0;

  const newPayerCents = sum(
    current.filter((d) => d.payerKey && !olderPayers.has(d.payerKey)),
  );
  if (hasHistory && newPayerCents >= MIN_NEW_WORK_CENTS) return "new_work";

  const currentTotal = sum(current);
  const priorTotal = sum(prior);
  if (prior.length > 0 && current.length === 0 && input.now.getUTCDate() >= STOPPED_WORK_DAY) {
    return "stopped";
  }

  if (prior.length === 0 && currentTotal >= MIN_NEW_WORK_CENTS && older.length > 0) {
    return "new_work";
  }

  if (prior.length === 0 || current.length === 0) return null;

  const priorAvg = priorTotal / prior.length;
  const currentAvg = currentTotal / current.length;
  const delta = currentAvg - priorAvg;
  if (currentAvg > priorAvg * PAYCHECK_RATIO && delta >= MIN_PAYCHECK_DELTA_CENTS) return "increase";
  if (priorAvg > currentAvg * PAYCHECK_RATIO && -delta >= MIN_PAYCHECK_DELTA_CENTS) return "decrease";
  return null;
}

const WAGE_REPORT_KEYS = new Set([
  "SSI",
  "SSDI",
  "DAC",
  "MEDICAID",
  "MEDICAIDABD",
  "MEDICAIDMAGI",
  "MEDICAIDWAIVER",
  "MAWD",
  "QMB",
  "EXTRAHELP",
  "LIS",
]);

function programKey(program: string): string {
  return program.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Programs that have to hear about this wage signal. SNAP is included only when
 * gross income is already over 130% FPL, and only for new work or an increase.
 */
export function programsThatMustReportWageChange(
  programs: string[],
  kind: WageChangeKind,
  grossMonthlyCents: number,
  householdSize: number,
): string[] {
  const overSnapLine = grossMonthlyCents > snapGross130Cents(householdSize);
  const out: string[] = [];
  for (const program of programs) {
    const key = programKey(program);
    if (!key || key === "SECTION8") continue;
    if (key === "SNAP") {
      if ((kind === "new_work" || kind === "increase") && overSnapLine) out.push(program);
      continue;
    }
    if (WAGE_REPORT_KEYS.has(key) || key.includes("EXTRA")) out.push(program);
  }
  return out;
}

function sum(rows: WageDeposit[]): number {
  return rows.reduce((n, d) => n + d.amountCents, 0);
}
