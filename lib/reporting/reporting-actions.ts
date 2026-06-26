import { utcMonthPrefix } from "@/lib/thresholds/metrics";
import { reportingDeadline, ruleForProgram, type ProgramRule } from "./program-rules";

/* ---------------------------------------------------------------------------
 * The Action Center engine. Given the beneficiary's enrolled programs, the
 * evaluated limit rows, and recent transactions, it detects changes worth
 * reporting and produces guided task cards: what happened, why it matters for
 * each enrolled program, the deadline, and how to report. Pure & testable.
 * ------------------------------------------------------------------------- */

export type ActionProgramGuidance = {
  short: string;
  agency: string;
  reportUrl: string;
  phone?: string;
  deadlineNote: string;
  howTo: string[];
};

export type ReportingAction = {
  id: string;
  severity: "report" | "review";
  title: string;
  detail: string;
  /** ISO deadline (PA: 10th of next month) or null. */
  deadlineISO: string | null;
  programs: ActionProgramGuidance[];
};

export type ReportingTx = {
  date: string;
  amountCents: number;
  userCategory: string;
  name?: string;
  merchantName?: string;
  pending?: boolean;
  excludedFromThresholds?: boolean;
};

export type ReportingRow = {
  thresholdType: string;
  label: string;
  program: string | null;
  status: "ok" | "watch" | "concern";
  attached: boolean;
};

const MIN_NEW_PAYER_CENTS = 50_00;
const INCOME_JUMP_FACTOR = 1.2;
const INCOME_JUMP_MIN_DELTA_CENTS = 200_00;

function payerName(t: ReportingTx): string {
  return (t.merchantName || t.name || "").trim();
}

function counts(t: ReportingTx, prefix: string): boolean {
  return (
    !t.pending &&
    !t.excludedFromThresholds &&
    t.userCategory === "earned_income" &&
    t.amountCents < 0 &&
    t.date.startsWith(prefix)
  );
}

function guidance(rule: ProgramRule): ActionProgramGuidance {
  return {
    short: rule.short,
    agency: rule.agency,
    reportUrl: rule.reportUrl,
    phone: rule.phone,
    deadlineNote: rule.deadlineNote,
    howTo: rule.howTo,
  };
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function buildReportingActions(input: {
  programs: string[];
  rows: ReportingRow[];
  transactions: ReportingTx[];
  now: Date;
}): ReportingAction[] {
  const { programs, rows, transactions, now } = input;
  const rules = programs.map(ruleForProgram).filter((r): r is ProgramRule => Boolean(r));
  if (rules.length === 0) return [];

  const { prefix } = utcMonthPrefix(now);
  const deadlineISO = reportingDeadline(now).toISOString();
  const actions: ReportingAction[] = [];

  // --- Signal 1: a new earned-income source (employer) this month ----------
  const priorPayers = new Set<string>();
  const currentPayers = new Map<string, number>();
  for (const t of transactions) {
    if (t.pending || t.excludedFromThresholds) continue;
    if (t.userCategory !== "earned_income" || t.amountCents >= 0) continue;
    const key = payerName(t).toLowerCase();
    if (!key) continue;
    if (t.date.startsWith(prefix)) {
      currentPayers.set(key, (currentPayers.get(key) ?? 0) + Math.abs(t.amountCents));
    } else {
      priorPayers.add(key);
    }
  }

  const newWorkRules = rules.filter((r) => r.reportsNewWork);
  const newPayerLabels: string[] = [];
  for (const t of transactions) {
    if (!t.date.startsWith(prefix)) continue;
    if (t.userCategory !== "earned_income" || t.amountCents >= 0) continue;
    const key = payerName(t).toLowerCase();
    if (!key || priorPayers.has(key)) continue;
    if ((currentPayers.get(key) ?? 0) < MIN_NEW_PAYER_CENTS) continue;
    const display = payerName(t);
    if (!newPayerLabels.includes(display)) newPayerLabels.push(display);
  }

  if (newPayerLabels.length > 0 && newWorkRules.length > 0) {
    const list = newPayerLabels.join(", ");
    actions.push({
      id: `new-work:${newPayerLabels.map((s) => s.toLowerCase()).sort().join("|")}`,
      severity: "report",
      title:
        newPayerLabels.length === 1
          ? `New income source detected: ${list}`
          : `New income sources detected: ${list}`,
      detail:
        "We saw earned income from a payer that's new this month. Starting or changing work is usually a reportable change.",
      deadlineISO,
      programs: newWorkRules.map(guidance),
    });
  }

  // --- Signal 2: earned income jumped vs the trailing average --------------
  if (newPayerLabels.length === 0) {
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      if (t.pending || t.excludedFromThresholds) continue;
      if (t.userCategory !== "earned_income" || t.amountCents >= 0) continue;
      const mp = t.date.slice(0, 7);
      byMonth.set(mp, (byMonth.get(mp) ?? 0) + Math.abs(t.amountCents));
    }
    const current = byMonth.get(prefix) ?? 0;
    const priorVals = [...byMonth.entries()].filter(([mp]) => mp !== prefix).map(([, v]) => v);
    if (current > 0 && priorVals.length > 0) {
      const avg = priorVals.reduce((a, b) => a + b, 0) / priorVals.length;
      if (avg > 0 && current >= avg * INCOME_JUMP_FACTOR && current - avg >= INCOME_JUMP_MIN_DELTA_CENTS) {
        const incomeRules = rules.filter((r) => r.reportsIncomeChange);
        if (incomeRules.length > 0) {
          actions.push({
            id: `income-jump:${prefix}`,
            severity: "report",
            title: "Your earned income went up this month",
            detail: `This month's earned income (${usd(current)}) is well above your recent average (${usd(
              Math.round(avg),
            )}). An income increase is usually reportable.`,
            deadlineISO,
            programs: incomeRules.map(guidance),
          });
        }
      }
    }
  }

  // --- Signal 3: currently over an attached limit --------------------------
  const concernByProgram = new Map<string, { labels: string[]; asset: boolean; income: boolean }>();
  for (const r of rows) {
    if (!r.attached || r.status !== "concern" || !r.program) continue;
    const rule = ruleForProgram(r.program);
    if (!rule) continue;
    const isAsset = r.thresholdType === "asset_balance";
    if (isAsset && !rule.reportsAssetChange) continue;
    if (!isAsset && !rule.reportsIncomeChange) continue;
    const entry = concernByProgram.get(rule.program) ?? { labels: [], asset: false, income: false };
    entry.labels.push(r.label);
    if (isAsset) entry.asset = true;
    else entry.income = true;
    concernByProgram.set(rule.program, entry);
  }
  for (const [program, entry] of concernByProgram) {
    const rule = ruleForProgram(program);
    if (!rule) continue;
    const kind = entry.asset && entry.income ? "income/asset" : entry.asset ? "asset" : "income";
    actions.push({
      id: `over:${program.toLowerCase()}`,
      severity: "report",
      title: `Over a ${rule.short} ${kind} limit`,
      detail: `Your estimated activity is above: ${entry.labels.join(
        "; ",
      )}. Excludable assets (a home, one car, ABLE/SNT) aren't subtracted here — review, then report if it stands.`,
      deadlineISO,
      programs: [guidance(rule)],
    });
  }

  // Reportable items first, then reviews; stable otherwise.
  return actions.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "report" ? -1 : 1));
}
