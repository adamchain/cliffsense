import { abdIncomeLimitCents } from "@/lib/benefits/abd-limits";
import { extraHelpIncomeLimitCents } from "@/lib/benefits/extra-help-limits";
import { qmbResourceLimitCents } from "@/lib/benefits/qmb-limits";
import { mawdIncomeLimitCents, mawdJobSuccessIncomeLimitCents } from "@/lib/benefits/mawd-limits";
import { SNAP_ELDERLY_RESOURCE_CENTS, SNAP_LUMP_SUM_CENTS, snapGross130Cents, snapGross200Cents } from "@/lib/benefits/snap-limits";
import { ssiFbrCents } from "@/lib/benefits/ssi";
import { WAIVER_GROSS_INCOME_CENTS } from "@/lib/benefits/waiver-limits";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import { reportingDueDate, ruleForProgram } from "@/lib/reporting/program-rules";

/**
 * Engineering control for every financial alert.
 *
 * A financial alert is the result of a program calculation for this person.
 * The explanation may only restate that result. It may not invent a threshold,
 * decide which income counts, or create a reporting deadline from a general
 * description of the program. When a required input is missing, the risk is
 * insufficient information and the alert does not declare the person over a limit.
 */

export type FinancialRisk =
  | "reporting_obligation"
  | "benefit_reduction"
  | "potential_ineligibility"
  | "insufficient_information";

export type DeadlineConfidence = "confirmed" | "estimated" | "unknown";

export type FinancialFinding = {
  whatChanged: string;
  whatCounts: string;
  risk: FinancialRisk;
  riskText: string;
  whatToDo: string;
  deadlineIso: string | null;
  deadlineSource: string;
  deadlineConfidence: DeadlineConfidence;
  program: string;
  countableCents: number | null;
  limitCents: number | null;
};

const RISK_LEAD: Record<FinancialRisk, string> = {
  reporting_obligation: "Reporting obligation.",
  benefit_reduction: "Benefit reduction.",
  potential_ineligibility: "Potential ineligibility.",
  insufficient_information: "Insufficient information.",
};

const RISKS = new Set<string>(Object.keys(RISK_LEAD));

export function isFinancialFinding(value: unknown): value is FinancialFinding {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<FinancialFinding>;
  return (
    typeof row.whatChanged === "string" &&
    row.whatChanged.length > 0 &&
    typeof row.whatCounts === "string" &&
    row.whatCounts.length > 0 &&
    typeof row.risk === "string" &&
    RISKS.has(row.risk) &&
    typeof row.riskText === "string" &&
    typeof row.whatToDo === "string" &&
    row.whatToDo.length > 0 &&
    (row.deadlineConfidence === "confirmed" ||
      row.deadlineConfidence === "estimated" ||
      row.deadlineConfidence === "unknown")
  );
}

export function renderFinancialFinding(finding: FinancialFinding): string {
  return [
    `What changed: ${finding.whatChanged}`,
    `What counts: ${finding.whatCounts}`,
    `What is the risk: ${finding.riskText}`,
    `What should I do: ${finding.whatToDo}`,
  ].join("\n");
}

export function monthLabel(prefix: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(prefix);
  if (!match) return prefix;
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(dt);
}

function money(cents: number): string {
  return formatPlainUsdFromCents(cents);
}

function formatUtcDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function enrolled(programs: string[], code: string): boolean {
  const key = code.toUpperCase();
  return programs.some((program) => program.toUpperCase().replace(/[^A-Z0-9]/g, "") === key);
}

type Deadline = {
  deadlineIso: string | null;
  deadlineSource: string;
  deadlineConfidence: DeadlineConfidence;
};

function withheldDeadline(source: string): Deadline {
  return { deadlineIso: null, deadlineSource: source, deadlineConfidence: "unknown" };
}

function clockDeadline(program: string, observedAt: Date, source: string): Deadline {
  const due = reportingDueDate(program, observedAt);
  if (!due) return withheldDeadline(source);
  return { deadlineIso: due.toISOString(), deadlineSource: source, deadlineConfidence: "estimated" };
}

function deadlineSentence(deadline: Deadline): string {
  if (deadline.deadlineConfidence === "confirmed" && deadline.deadlineIso) {
    return `The deadline is ${formatUtcDate(deadline.deadlineIso)}, from a notice.`;
  }
  if (deadline.deadlineConfidence === "estimated" && deadline.deadlineIso) {
    return `The estimated deadline is ${formatUtcDate(deadline.deadlineIso)}. ${deadline.deadlineSource} A date on a notice replaces this estimate.`;
  }
  return deadline.deadlineSource;
}

type Comparison = {
  countableCents: number;
  limitCents: number;
  limitLabel: string;
  crossed: boolean;
  boundary: string;
};

function composeFinancialFinding(input: {
  program: string;
  monthPrefix: string;
  detectedCents: number;
  detectedLabel: string;
  formula: string;
  exclusions: string[];
  risk: FinancialRisk;
  riskDetail: string;
  action: string;
  deadline: Deadline;
  comparison?: Comparison;
}): FinancialFinding {
  const formula = input.formula.trim();
  const action = input.action.trim();
  if (!formula || !action || !input.detectedLabel.trim()) {
    throw new Error("A financial alert needs the change, the calculation, and the action.");
  }
  const comparison = input.risk === "insufficient_information" ? undefined : input.comparison;
  const exclusionText = input.exclusions.filter((line) => line.trim().length > 0).join(" ");
  const comparisonText = comparison
    ? `${money(comparison.countableCents)} is the counted amount. The stored ${comparison.limitLabel} is ${money(comparison.limitCents)}. ${
        comparison.crossed
          ? "The counted amount has crossed that limit."
          : "The counted amount has not crossed that limit."
      } ${comparison.boundary}`
    : "";
  return {
    whatChanged: `In ${monthLabel(input.monthPrefix)}, ${input.detectedLabel} is ${money(input.detectedCents)}.`,
    whatCounts: [formula, exclusionText, comparisonText].filter(Boolean).join(" "),
    risk: input.risk,
    riskText: `${RISK_LEAD[input.risk]} ${input.riskDetail}`.trim(),
    whatToDo: `${action} ${deadlineSentence(input.deadline)}`.trim(),
    deadlineIso: input.deadline.deadlineIso,
    deadlineSource: input.deadline.deadlineSource,
    deadlineConfidence: input.deadline.deadlineConfidence,
    program: input.program,
    countableCents: comparison ? comparison.countableCents : null,
    limitCents: comparison ? comparison.limitCents : null,
  };
}

const NOTICE_ONLY =
  "No reporting deadline was calculated for this alert. A date printed on a notice controls.";

const RESOURCE_EXCLUSIONS =
  "Credit, loans, ABLE accounts, and accounts whose name identifies a special needs trust are left out. A home, a vehicle, and burial funds are not in this bank total.";

function irweLine(irweCents: number): string {
  return irweCents > 0
    ? `Recorded work expenses of ${money(irweCents)} were subtracted from earned income.`
    : "No work expenses were entered, so none were subtracted.";
}

/**
 * QMB income. A DAC exclusion used for the waiver or Healthy Horizons is not
 * applied here. When DAC is enrolled and the earned income alone has not
 * crossed the limit, the benefit deposits are not a verified QMB budget.
 */
export function qmbIncomeFinding(input: {
  programs: string[];
  countableCents: number;
  earnedCountableCents: number;
  limitCents: number;
  level: "warning" | "breach";
  irweCents: number;
  monthPrefix: string;
  observedAt: Date;
}): { finding: FinancialFinding; level: "warning" | "breach" } {
  const onDac = enrolled(input.programs, "DAC");
  const wagesAloneCrossed = input.level === "breach" && input.earnedCountableCents > input.limitCents;
  const formula =
    "The stored QMB addition counts every benefit deposit and other income, then earned income after the $65 exclusion, recorded work expenses, and one-half. The $20 general exclusion is already inside the published limit and is not subtracted again.";
  if (onDac && !wagesAloneCrossed) {
    return {
      level: "warning",
      finding: composeFinancialFinding({
        program: "QMB",
        monthPrefix: input.monthPrefix,
        detectedCents: input.countableCents,
        detectedLabel: "the stored QMB addition",
        formula: `${formula} A DAC benefit is left out of the waiver special-income limit and of Healthy Horizons. That exclusion is not applied to this QMB figure. This case does not record whether QMB is categorically needy, Medicare cost-sharing, or Disabled Adult Child buy-in, and the benefit deposits are not identified as DAC or SSDI.`,
        exclusions: [irweLine(input.irweCents), "The waiver DAC exclusion was not applied."],
        risk: "insufficient_information",
        riskDetail:
          "The DAC exclusion used for waiver eligibility does not establish the income treatment for this Medicare Savings Program.",
        action:
          "Confirm the QMB category and which Social Security deposit is the DAC benefit before using this total. Do not report an amount from this unverified addition.",
        deadline: withheldDeadline(NOTICE_ONLY),
      }),
    };
  }
  const crossed = input.level === "breach";
  return {
    level: input.level,
    finding: composeFinancialFinding({
      program: "QMB",
      monthPrefix: input.monthPrefix,
      detectedCents: input.countableCents,
      detectedLabel: "QMB income from the stored addition",
      formula: onDac
        ? `${formula} Earned income after those earned-income steps is already past the stored limit, so the unidentified benefit deposits are not what crossed it. The waiver DAC exclusion was still not applied.`
        : `${formula} DAC is not an enrolled program, so no DAC exclusion was applied.`,
      exclusions: [irweLine(input.irweCents)],
      risk: crossed ? "potential_ineligibility" : "reporting_obligation",
      riskDetail: crossed
        ? "The counted QMB income has crossed the stored QMB income limit."
        : "The counted QMB income is inside the watch band and has not crossed the stored limit.",
      action: "Report this QMB income change to the County Assistance Office. This action is for QMB only.",
      deadline: clockDeadline(
        "QMB",
        input.observedAt,
        "QMB income changes are reported to the County Assistance Office within 10 days.",
      ),
      comparison: {
        countableCents: input.countableCents,
        limitCents: input.limitCents,
        limitLabel: "QMB income limit",
        crossed,
        boundary: "Income equal to this limit still qualifies.",
      },
    }),
  };
}

export function qmbResourceFinding(input: {
  countedCents: number;
  householdSize: number;
  monthPrefix: string;
}): FinancialFinding {
  const limit = qmbResourceLimitCents(input.householdSize);
  return composeFinancialFinding({
    program: "QMB",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countedCents,
    detectedLabel: "counted resource accounts",
    formula: `The Medicare cost-sharing resource limit on file for this household is ${money(limit)}. Categorically needy QMB uses a different resource limit. This case does not record the QMB category, so this comparison is not a verified QMB resource budget.`,
    exclusions: [RESOURCE_EXCLUSIONS],
    risk: "insufficient_information",
    riskDetail: "The operative QMB resource limit depends on the category, which is not recorded.",
    action: "Confirm the QMB category before treating the cost-sharing resource limit as the one that applies.",
    deadline: withheldDeadline(NOTICE_ONLY),
  });
}

export function snapReportingFinding(input: {
  grossCents: number;
  householdSize: number;
  monthPrefix: string;
  observedAt: Date;
}): FinancialFinding {
  const limit = snapGross130Cents(input.householdSize);
  return composeFinancialFinding({
    program: "SNAP",
    monthPrefix: input.monthPrefix,
    detectedCents: input.grossCents,
    detectedLabel: "SNAP gross income",
    formula: `Simplified reporting uses gross income. A single other-income deposit of ${money(SNAP_LUMP_SUM_CENTS)} or more was left out before this figure. Earned-income, shelter, and medical deductions are not part of this test. The 200% gross ceiling is a different test and is not this alert.`,
    exclusions: [],
    risk: "reporting_obligation",
    riskDetail: "Gross income over 130% of the poverty line is a simplified-reporting trigger.",
    action:
      "Report this gross income to the County Assistance Office through COMPASS or by phone. Keep the pay stubs for this month.",
    deadline: clockDeadline(
      "SNAP",
      input.observedAt,
      "For a household that must report it, gross income over 130% of the poverty line is due within 10 days.",
    ),
    comparison: {
      countableCents: input.grossCents,
      limitCents: limit,
      limitLabel: "130% gross reporting line",
      crossed: input.grossCents > limit,
      boundary: "Income exactly on this line waits for the semi-annual report.",
    },
  });
}

export function snapGrossCeilingFinding(input: {
  grossCents: number;
  limitCents: number;
  lumpLeftOutCents: number;
  monthPrefix: string;
  crossed: boolean;
}): FinancialFinding {
  return composeFinancialFinding({
    program: "SNAP",
    monthPrefix: input.monthPrefix,
    detectedCents: input.grossCents,
    detectedLabel: "SNAP gross income",
    formula: `This is the 200% gross ceiling. Other-income deposits of ${money(SNAP_LUMP_SUM_CENTS)} or more, totaling ${money(input.lumpLeftOutCents)}, were left out. Earned-income, shelter, and medical deductions were not applied. This is not the 10-day reporting line.`,
    exclusions: [],
    risk: "potential_ineligibility",
    riskDetail: input.crossed
      ? "Gross income has reached the stored 200% ceiling. That can end broad-based categorical eligibility. The net-income test was not run."
      : "Gross income is under the stored 200% ceiling. This is the watch band for that ceiling, not a 10-day reporting trigger.",
    action:
      "Do not use this ceiling as a 10-day reporting deadline. Confirm the household's SNAP reporting category, and use the date on any notice. Net-income deductions were not calculated.",
    deadline: withheldDeadline(
      "This gross-ceiling comparison is not the 10-day simplified-reporting clock. A date printed on a notice controls.",
    ),
    comparison: {
      countableCents: input.grossCents,
      limitCents: input.limitCents,
      limitLabel: "200% gross ceiling",
      crossed: input.crossed,
      boundary: "The 10-day income report is gross income over 130% of the poverty line, which is a separate alert.",
    },
  });
}

export function snapElderlyResourceFinding(input: {
  assetCents: number;
  grossCents: number;
  householdSize: number;
  monthPrefix: string;
  crossed: boolean;
}): FinancialFinding {
  const ceiling = snapGross200Cents(input.householdSize);
  return composeFinancialFinding({
    program: "SNAP",
    monthPrefix: input.monthPrefix,
    detectedCents: input.assetCents,
    detectedLabel: "counted resource accounts",
    formula: `The ${money(SNAP_ELDERLY_RESOURCE_CENTS)} resource figure is used only when gross income is already over the 200% ceiling and the household is age 60 or older or enrolled in SSI, SSDI, or DAC. SNAP gross income for that gate is ${money(input.grossCents)}. The 200% ceiling for this household is ${money(ceiling)}.`,
    exclusions: [RESOURCE_EXCLUSIONS],
    risk: "potential_ineligibility",
    riskDetail: input.crossed
      ? "Counted accounts are above the resource figure that applies after the 200% gross ceiling."
      : "Counted accounts are in the watch band for that resource figure and have not crossed it.",
    action:
      "Confirm age or disability and the gross-income figure before moving savings. Ordinary balances while the household is at or under the 200% ceiling are not this resource test.",
    deadline: withheldDeadline(NOTICE_ONLY),
    comparison: {
      countableCents: input.assetCents,
      limitCents: SNAP_ELDERLY_RESOURCE_CENTS,
      limitLabel: "SNAP resource figure for a household already over the 200% ceiling",
      crossed: input.crossed,
      boundary: "This resource figure does not apply while gross income is at or under the 200% ceiling.",
    },
  });
}

export function waiverIncomeFinding(input: {
  programs: string[];
  countableCents: number;
  dacExcludedCents: number;
  monthPrefix: string;
  observedAt: Date;
  level: "warning" | "breach";
}): FinancialFinding {
  const onDac = enrolled(input.programs, "DAC");
  const identified = input.dacExcludedCents > 0;
  if (onDac && !identified) {
    return composeFinancialFinding({
      program: "MedicaidWaiver",
      monthPrefix: input.monthPrefix,
      detectedCents: input.countableCents,
      detectedLabel: "the waiver gross figure",
      formula:
        "The waiver special-income limit counts gross wages, benefit deposits, and other income. The $20, $65, and one-half disregards are not applied. A DAC benefit is left out only when a deposit is identified as DAC. No deposit was identified, so no DAC dollars were removed.",
      exclusions: [],
      risk: "insufficient_information",
      riskDetail: "The waiver DAC exclusion did not run, because the DAC deposit was not identified.",
      action: "Identify which deposit is the DAC benefit before using this waiver total.",
      deadline: withheldDeadline(NOTICE_ONLY),
    });
  }
  const crossed = input.level === "breach";
  return composeFinancialFinding({
    program: "MedicaidWaiver",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countableCents,
    detectedLabel: "waiver gross countable income",
    formula:
      "The waiver special-income limit counts gross wages, SSDI, and other income. The $20, $65, and one-half disregards are not applied.",
    exclusions: [
      identified
        ? `Named DAC deposits of ${money(input.dacExcludedCents)} were left out.`
        : "DAC is not an enrolled program, so no DAC exclusion was applied.",
    ],
    risk: "potential_ineligibility",
    riskDetail: crossed
      ? "Gross countable income is over the waiver special-income limit."
      : "Gross countable income is inside the watch band. Income equal to the limit still qualifies.",
    action: "Report this waiver income change to the County Assistance Office. This action is for the waiver only.",
    deadline: clockDeadline(
      "MedicaidWaiver",
      input.observedAt,
      "Waiver income changes are reported to the County Assistance Office within 10 days.",
    ),
    comparison: {
      countableCents: input.countableCents,
      limitCents: WAIVER_GROSS_INCOME_CENTS,
      limitLabel: "waiver special-income limit",
      crossed,
      boundary: "Income equal to this limit still qualifies.",
    },
  });
}

export function ssiIncomeFinding(input: {
  countableCents: number;
  householdSize: number;
  irweCents: number;
  monthPrefix: string;
  observedAt: Date;
  level: "warning" | "breach";
}): FinancialFinding {
  const limit = ssiFbrCents(input.householdSize);
  const crossed = input.level === "breach";
  return composeFinancialFinding({
    program: "SSI",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countableCents,
    detectedLabel: "SSI countable income",
    formula:
      "This is the SSI calculator: an identified SSI payment is removed from unearned income, the $20 general exclusion is applied to unearned income first, and earned income is reduced by any student exclusion, the $65 exclusion, recorded work expenses, and one-half of what remains.",
    exclusions: [irweLine(input.irweCents)],
    risk: crossed ? "benefit_reduction" : "reporting_obligation",
    riskDetail: crossed
      ? "Countable income has reached the federal benefit rate, which reduces the SSI payment."
      : "Countable income is inside the watch band and has not reached the federal benefit rate.",
    action: "Report the income change to SSA. SSI financial changes are due by the 10th of the next month.",
    deadline: clockDeadline(
      "SSI",
      input.observedAt,
      "SSI financial changes are due by the 10th of the month after the change.",
    ),
    comparison: {
      countableCents: input.countableCents,
      limitCents: limit,
      limitLabel: "SSI federal benefit rate",
      crossed,
      boundary: "Countable income at the federal benefit rate reduces the SSI payment.",
    },
  });
}

export function resourceScreenFinding(input: {
  program: string;
  countedCents: number;
  limitCents: number;
  limitLabel: string;
  monthPrefix: string;
  observedAt: Date;
  crossed: boolean;
  clock: boolean;
  clockSource: string;
  action: string;
  boundary?: string;
}): FinancialFinding {
  return composeFinancialFinding({
    program: input.program,
    monthPrefix: input.monthPrefix,
    detectedCents: input.countedCents,
    detectedLabel: "counted resource accounts",
    formula: `This is the counted bank total compared with the stored ${input.limitLabel}.`,
    exclusions: [RESOURCE_EXCLUSIONS],
    risk: "potential_ineligibility",
    riskDetail: input.crossed
      ? "The counted accounts have crossed the stored resource limit."
      : "The counted accounts are in the watch band and have not crossed the stored resource limit.",
    action: input.action,
    deadline: input.clock
      ? clockDeadline(input.program, input.observedAt, input.clockSource)
      : withheldDeadline(NOTICE_ONLY),
    comparison: {
      countableCents: input.countedCents,
      limitCents: input.limitCents,
      limitLabel: input.limitLabel,
      crossed: input.crossed,
      boundary:
        input.boundary ??
        "Accounts exactly at the stored limit are not treated as crossed by this resource screen.",
    },
  });
}

export function extraHelpIncomeFinding(input: {
  countableCents: number;
  householdSize: number;
  irweCents: number;
  monthPrefix: string;
  observedAt: Date;
  level: "warning" | "breach";
}): FinancialFinding {
  const limit = extraHelpIncomeLimitCents(input.householdSize);
  const crossed = input.level === "breach";
  return composeFinancialFinding({
    program: "ExtraHelp",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countableCents,
    detectedLabel: "Extra Help income",
    formula:
      "Extra Help income counts benefit deposits, including a DAC benefit, other income, and earned income after the $65 exclusion, recorded work expenses, and one-half. The $20 general exclusion is already inside the published limit and is not subtracted again. The waiver DAC exclusion is not used.",
    exclusions: [irweLine(input.irweCents)],
    risk: crossed ? "potential_ineligibility" : "reporting_obligation",
    riskDetail: crossed
      ? "Counted income has reached the stored Extra Help income limit. The person must be below it."
      : "Counted income is inside the watch band and is still below the stored limit.",
    action:
      "Report this income change to SSA. Someone who has Medicaid, QMB, or SSI gets Extra Help automatically and does not file a separate Extra Help application.",
    deadline: clockDeadline("ExtraHelp", input.observedAt, "An Extra Help-only case reports income changes to SSA by the 10th of the next month."),
    comparison: {
      countableCents: input.countableCents,
      limitCents: limit,
      limitLabel: "Extra Help income limit",
      crossed,
      boundary: "Income must be below this limit. An amount equal to the limit has reached it.",
    },
  });
}

export function abdIncomeFinding(input: {
  programs: string[];
  countableCents: number;
  dacExcludedCents: number;
  householdSize: number;
  irweCents: number;
  monthPrefix: string;
  observedAt: Date;
  level: "warning" | "breach";
}): FinancialFinding {
  const onDac = enrolled(input.programs, "DAC");
  if (onDac && input.dacExcludedCents <= 0) {
    return composeFinancialFinding({
      program: "MedicaidABD",
      monthPrefix: input.monthPrefix,
      detectedCents: input.countableCents,
      detectedLabel: "the Healthy Horizons figure",
      formula:
        "Healthy Horizons uses the SSI countable steps after an identified SSI payment and an identified DAC benefit are removed. No deposit was identified as DAC, so no DAC dollars were removed.",
      exclusions: [irweLine(input.irweCents)],
      risk: "insufficient_information",
      riskDetail: "The Healthy Horizons DAC exclusion did not run, because the DAC deposit was not identified.",
      action: "Identify which deposit is the DAC benefit before using this Healthy Horizons total.",
      deadline: withheldDeadline(NOTICE_ONLY),
    });
  }
  const limit = abdIncomeLimitCents(input.householdSize);
  const crossed = input.level === "breach";
  return composeFinancialFinding({
    program: "MedicaidABD",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countableCents,
    detectedLabel: "Healthy Horizons countable income",
    formula:
      "Healthy Horizons countable income removes an identified SSI payment and an identified DAC benefit, then applies the $20 general exclusion, the $65 earned exclusion, recorded work expenses, and one-half. The published limit is 100% of the poverty guideline. The $20 is subtracted in this figure and is not added on top of the limit.",
    exclusions: [
      input.dacExcludedCents > 0
        ? `Named DAC deposits of ${money(input.dacExcludedCents)} were left out.`
        : "DAC is not an enrolled program, so no DAC exclusion was applied.",
      irweLine(input.irweCents),
    ],
    risk: "potential_ineligibility",
    riskDetail: crossed
      ? "Countable income has reached the Healthy Horizons income limit."
      : "Countable income is inside the watch band and has not crossed the Healthy Horizons income limit.",
    action: "Report this Healthy Horizons income change to the County Assistance Office.",
    deadline: clockDeadline(
      "MedicaidABD",
      input.observedAt,
      "Healthy Horizons income changes are reported to the County Assistance Office within 10 days.",
    ),
    comparison: {
      countableCents: input.countableCents,
      limitCents: limit,
      limitLabel: "Healthy Horizons income limit",
      crossed,
      boundary: "Income equal to this limit has reached it.",
    },
  });
}

export function mawdIncomeFinding(input: {
  countableCents: number;
  householdSize: number;
  jobSuccess: boolean;
  irweCents: number;
  monthPrefix: string;
  observedAt: Date;
  level: "warning" | "breach";
}): FinancialFinding {
  const limit = input.jobSuccess
    ? mawdJobSuccessIncomeLimitCents(input.householdSize)
    : mawdIncomeLimitCents(input.householdSize);
  const crossed = input.level === "breach";
  return composeFinancialFinding({
    program: "MAWD",
    monthPrefix: input.monthPrefix,
    detectedCents: input.countableCents,
    detectedLabel: "MAWD countable income",
    formula: input.jobSuccess
      ? "Workers with Job Success is recorded. Countable income uses the $20, $65, recorded work expenses, and one-half, compared with the 600% limit."
      : "MAWD countable income uses the $20, $65, recorded work expenses, and one-half, compared with the 250% limit. Workers with Job Success is not recorded, so the 600% limit was not used.",
    exclusions: [irweLine(input.irweCents)],
    risk: "potential_ineligibility",
    riskDetail: crossed
      ? "Countable income has reached the MAWD income limit on file for this enrollment."
      : "Countable income is inside the watch band and has not reached the MAWD income limit.",
    action: "Report this MAWD income change to the County Assistance Office. Paid employment is required for MAWD.",
    deadline: clockDeadline("MAWD", input.observedAt, "MAWD income changes are reported to the County Assistance Office within 10 days."),
    comparison: {
      countableCents: input.countableCents,
      limitCents: limit,
      limitLabel: input.jobSuccess ? "MAWD Workers with Job Success income limit" : "MAWD income limit",
      crossed,
      boundary: "Income equal to this limit has reached it.",
    },
  });
}

export function magiIncomeFinding(input: {
  grossCents: number;
  monthPrefix: string;
}): FinancialFinding {
  return composeFinancialFinding({
    program: "MedicaidMAGI",
    monthPrefix: input.monthPrefix,
    detectedCents: input.grossCents,
    detectedLabel: "gross bank deposits",
    formula:
      "This figure is gross wages, benefit deposits, and other income from the bank feed. MAGI adjustments, such as pre-tax deductions, were not calculated. The adult 138% limit was not applied to a MAGI budget.",
    exclusions: [],
    risk: "insufficient_information",
    riskDetail: "Gross deposits are not a verified MAGI income calculation.",
    action: "Do not treat this gross total as MAGI income. A notice date controls any reporting deadline.",
    deadline: withheldDeadline(NOTICE_ONLY),
  });
}

export function findingForLiveThreshold(input: {
  program: string;
  thresholdType: string;
  label: string;
  currentCents: number;
  limitCents: number;
  crossed: boolean;
  householdSize: number;
  monthPrefix: string;
  observedAt: Date;
  lumpLeftOutCents: number;
  irweCents: number;
}): FinancialFinding {
  const program = input.program.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (program === "SNAP" && input.thresholdType === "monthly_gross_income") {
    return snapGrossCeilingFinding({
      grossCents: input.currentCents,
      limitCents: input.limitCents,
      lumpLeftOutCents: input.lumpLeftOutCents,
      monthPrefix: input.monthPrefix,
      crossed: input.crossed,
    });
  }
  if (program === "SSI" && input.thresholdType === "monthly_unearned_income") {
    return ssiIncomeFinding({
      countableCents: input.currentCents,
      householdSize: input.householdSize,
      irweCents: input.irweCents,
      monthPrefix: input.monthPrefix,
      observedAt: input.observedAt,
      level: input.crossed ? "breach" : "warning",
    });
  }
  if (input.thresholdType === "asset_balance") {
    const rule = ruleForProgram(input.program);
    return resourceScreenFinding({
      program: input.program,
      countedCents: input.currentCents,
      limitCents: input.limitCents,
      limitLabel: input.label,
      monthPrefix: input.monthPrefix,
      observedAt: input.observedAt,
      crossed: input.crossed,
      clock: program === "SSI",
      clockSource: rule?.deadlineNote ?? "Use the date on the notice.",
      action:
        program === "SSI"
          ? "Report the resource change to SSA."
          : "This bank total is not a complete resource budget. Confirm the program's resource exclusions before reporting an amount from it.",
    });
  }
  if (input.thresholdType === "monthly_earned_income") {
    return composeFinancialFinding({
      program: input.program,
      monthPrefix: input.monthPrefix,
      detectedCents: input.currentCents,
      detectedLabel: "gross earned deposits",
      formula: `These are gross earned deposits compared with the stored limit “${input.label}”. Recorded work expenses were not subtracted. This is not the Trial Work Period or substantial-gainful-activity calculation.`,
      exclusions: [],
      risk: "insufficient_information",
      riskDetail: "Gross earned deposits are not countable earnings for this limit.",
      action: "Do not report this gross figure as countable earnings. The work-incentive alerts are separate.",
      deadline: withheldDeadline(NOTICE_ONLY),
    });
  }
  return composeFinancialFinding({
    program: input.program,
    monthPrefix: input.monthPrefix,
    detectedCents: input.currentCents,
    detectedLabel: "the amount from the stored calculator",
    formula:
      input.thresholdType === "monthly_unearned_income"
        ? `This amount was produced by the SSI countable calculator and compared with “${input.label}”. That calculator is not verified as this program's income formula.`
        : `This amount was compared with “${input.label}” without a program-specific exclusion list.`,
    exclusions: [],
    risk: "insufficient_information",
    riskDetail: "The program-specific calculation for this limit is not attached to the alert.",
    action: "Do not report an amount from this comparison until the program's own calculation is attached.",
    deadline: withheldDeadline(NOTICE_ONLY),
  });
}
