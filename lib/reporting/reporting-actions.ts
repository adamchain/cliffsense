import { detectWageChange, programsThatMustReportWageChange, type WageDeposit } from "@/lib/alerts/wage-change";
import { grossMonthlyIncomeCents, monthlyIncomeBreakdownCents, utcMonthPrefix } from "@/lib/thresholds/metrics";
import { ruleForProgram, soonestReportingDue, type ProgramRule } from "./program-rules";

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
  /** Optional 7-field playbook to show on the Action Center card. */
  playbookId?: string;
  classifyHref?: string;
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

function payerName(t: ReportingTx): string {
  return (t.merchantName || t.name || "").trim();
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
  householdSize?: number;
}): ReportingAction[] {
  const { programs, rows, transactions, now } = input;
  const householdSize = input.householdSize ?? 1;
  const rules = programs.map(ruleForProgram).filter((r): r is ProgramRule => Boolean(r));
  if (rules.length === 0) return [];

  const { prefix } = utcMonthPrefix(now);
  const actions: ReportingAction[] = [];
  const gross = grossMonthlyIncomeCents(
    monthlyIncomeBreakdownCents(
      transactions.map((t) => ({
        date: t.date,
        amountCents: t.amountCents,
        userCategory: t.userCategory,
        pending: Boolean(t.pending),
        excludedFromThresholds: Boolean(t.excludedFromThresholds),
      })),
      prefix,
    ),
  );

  const deposits: WageDeposit[] = [];
  for (const t of transactions) {
    if (t.pending || t.excludedFromThresholds) continue;
    if (t.userCategory !== "earned_income" || t.amountCents >= 0) continue;
    deposits.push({
      date: t.date,
      amountCents: Math.abs(t.amountCents),
      payerKey: payerName(t).toLowerCase(),
    });
  }
  const hasHistoryBeforeMonth = transactions.some((t) => t.date.slice(0, 7) < prefix);
  const wageKind = detectWageChange({ monthPrefix: prefix, deposits, now, hasHistoryBeforeMonth });
  if (wageKind) {
    const targets = programsThatMustReportWageChange(programs, wageKind, gross, householdSize);
    const wageRules = targets.map(ruleForProgram).filter((r): r is ProgramRule => Boolean(r));
    if (wageRules.length > 0) {
      const titles: Record<typeof wageKind, string> = {
        new_work: "New or restarted work",
        increase: "Your earned income went up",
        decrease: "Your earned income went down",
        stopped: "Earned income stopped",
      };
      actions.push({
        id: `wage-change:${wageKind}:${prefix}`,
        severity: "report",
        title: titles[wageKind],
        detail:
          "Compare gross pay stubs to this deposit, then report on each program's own clock. SNAP is listed only when gross income is over 130% FPL.",
        deadlineISO: soonestReportingDue(
          wageRules.map((r) => r.program),
          now,
        ),
        programs: wageRules.map(guidance),
        playbookId: "reporting_wage_change_10day",
      });
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
      deadlineISO: soonestReportingDue([program], now),
      programs: [guidance(rule)],
    });
  }

  // --- Signal 4: unusual non-wage deposits (gifts, settlements, unlabeled transfers) ---
  const LUMP_MIN_SINGLE_CENTS = 1000_00;
  const LUMP_MIN_MONTH_CENTS = 1500_00;
  const unusualCats = new Set(["other_income", "unclear", "transfer"]);
  let unusualMonth = 0;
  const unusualNames: string[] = [];
  for (const t of transactions) {
    if (t.pending || t.excludedFromThresholds) continue;
    if (!t.date.startsWith(prefix)) continue;
    if (t.amountCents >= 0) continue;
    if (!unusualCats.has(t.userCategory)) continue;
    const amt = Math.abs(t.amountCents);
    unusualMonth += amt;
    if (amt >= LUMP_MIN_SINGLE_CENTS) {
      const label = payerName(t) || "deposit";
      if (!unusualNames.includes(label)) unusualNames.push(label);
    }
  }
  if (unusualMonth >= LUMP_MIN_MONTH_CENTS || unusualNames.length > 0) {
    const means = rules.filter((r) => r.reportsAssetChange || r.reportsIncomeChange);
    if (means.length > 0) {
      actions.push({
        id: `unusual-deposit:${prefix}`,
        severity: "review",
        title: "Unusual deposit — review before month-end",
        detail:
          unusualNames.length > 0
            ? `Large non-wage inflow this month (${usd(unusualMonth)}) including: ${unusualNames.join(
                ", ",
              )}. Classify it (income, resource, reimbursement, or trust) before the next resource month. Do not give the money away or move it into someone else's account.`
            : `Non-wage inflows this month total ${usd(
                unusualMonth,
              )}. Classify them (income vs resource vs reimbursement vs trust) before month-end. Spending later may not erase a receipt-month income event.`,
        deadlineISO: soonestReportingDue(
          means.map((r) => r.program),
          now,
        ),
        programs: means.map(guidance),
        playbookId: "reporting_lump_sum",
        classifyHref: "/transactions",
      });
    }
  }

  // Reportable items first, then reviews; stable otherwise.
  return actions.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "report" ? -1 : 1));
}
