/**
 * Per-program reporting guidance. When the bank sync detects a change (a new
 * income source, an income jump, or crossing a limit), the Action Center uses
 * these rules to tell the user what to report, to whom, and by when — prompt +
 * how-to + deadline. Informational only; not legal advice or a determination.
 *
 * Pennsylvania-focused. Clocks are not interchangeable: SSI and Extra Help use
 * the 10th of the next month, Medicaid uses 10 days, SSDI is prompt, and SNAP
 * simplified reporting has only three 10-day triggers.
 */

export type ProgramRule = {
  /** Matches Beneficiary.benefitsEnrolled[].program (compared case-insensitively). */
  program: string;
  /** Short program name for UI ("SSDI", "SNAP"…). */
  short: string;
  agency: string;
  /** Does the program want to hear about each kind of change? */
  reportsNewWork: boolean;
  reportsIncomeChange: boolean;
  reportsAssetChange: boolean;
  /** Where/how to report. */
  reportUrl: string;
  phone?: string;
  howTo: string[];
  /** One-line note on the reporting deadline. */
  deadlineNote: string;
};

const COMPASS = "https://www.compass.state.pa.us/compass.web/Public/CMPHome";
const SSA_REPORT_WORK = "https://www.ssa.gov/manage-benefits/report-changes-affect-disability-benefits";
const SSA_SSI_REPORT = "https://www.ssa.gov/ssi/text-report-ussi.htm";
const SSA_PHONE = "1-800-772-1213";
const PA_DHS_PHONE = "1-877-395-8930";

const COMPASS_HOW_TO = [
  "Report through COMPASS (compass.state.pa.us) or the myCOMPASS PA app.",
  `Or call ${PA_DHS_PHONE}, or your County Assistance Office caseworker.`,
  "If a Special Needs Trust or ABLE account holds the funds, note that — those resources are excluded while they stay in the trust/ABLE account.",
];

function compassRule(
  program: string,
  short: string,
  reportsAssetChange: boolean,
  extraHow?: string[],
): ProgramRule {
  return {
    program,
    short,
    agency: "PA County Assistance Office",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange,
    reportUrl: COMPASS,
    phone: PA_DHS_PHONE,
    deadlineNote: "PA requires reporting income, asset, household, or work changes within 10 days.",
    howTo: extraHow ? [...COMPASS_HOW_TO, ...extraHow] : COMPASS_HOW_TO,
  };
}

export const PROGRAM_RULES: ProgramRule[] = [
  {
    program: "SSDI",
    short: "SSDI",
    agency: "Social Security Administration",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: false, // SSDI has no asset limit
    reportUrl: SSA_REPORT_WORK,
    phone: SSA_PHONE,
    deadlineNote: "Report work and earnings to SSA promptly. SSDI has no fixed 10th-of-the-month wage calendar.",
    howTo: [
      "Report wages in the my Social Security portal or the SSA mobile wage-reporting app.",
      `Or call SSA at ${SSA_PHONE}, or visit your local Social Security office.`,
      "Keep your pay stubs — SSA may ask for monthly gross earnings.",
    ],
  },
  {
    program: "SSI",
    short: "SSI",
    agency: "Social Security Administration",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: true,
    reportUrl: SSA_SSI_REPORT,
    phone: SSA_PHONE,
    deadlineNote: "Report changes to SSA by the 10th of the month after the change; report monthly wages early in the month.",
    howTo: [
      "Report monthly wages with the SSI Mobile Wage Reporting app or by phone.",
      `Report income, resource, or household changes to SSA at ${SSA_PHONE} or your local office.`,
      "Resources are checked on the first of the month — keep balances documented.",
    ],
  },
  {
    program: "SNAP",
    short: "SNAP",
    agency: "PA County Assistance Office",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: false, // most PA SNAP households have no asset test
    reportUrl: COMPASS,
    phone: PA_DHS_PHONE,
    deadlineNote:
      "Simplified reporting: within 10 days only if gross income exceeds 130% FPL, ABAWD hours drop below 80 a month, or gambling winnings are $4,750 or more. A raise under 130% FPL waits for the semi-annual report.",
    howTo: [
      "Report through COMPASS (compass.state.pa.us) or the myCOMPASS PA app.",
      `Or call the Statewide Customer Service Center at ${PA_DHS_PHONE}, or your County Assistance Office.`,
      "Have recent pay stubs or an offer letter ready.",
    ],
  },
  {
    program: "DAC",
    short: "DAC",
    agency: "Social Security Administration",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: false,
    reportUrl: SSA_REPORT_WORK,
    phone: SSA_PHONE,
    deadlineNote: "Report work and earnings to SSA promptly. Marriage can also end DAC.",
    howTo: [
      "Report wages in the my Social Security portal or by phone.",
      `Or call SSA at ${SSA_PHONE}, or visit your local Social Security office.`,
      "Keep pay stubs and medical evidence. Do not assume marriage or wages are ignored.",
    ],
  },
  compassRule("Medicaid", "Medicaid", true),
  compassRule("MedicaidABD", "ABD Medicaid", true),
  compassRule("MedicaidMAGI", "MAGI Medicaid", false),
  compassRule("MedicaidWaiver", "HCBS Waiver", true),
  compassRule("MAWD", "MAWD", true, ["Paid employment is required; the premium is usually 5% of countable income."]),
  compassRule("QMB", "QMB", true),
  {
    program: "ExtraHelp",
    short: "Extra Help",
    agency: "Social Security Administration",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: true,
    reportUrl: SSA_REPORT_WORK,
    phone: SSA_PHONE,
    deadlineNote: "Report Extra Help changes to SSA by the 10th of the month after the change.",
    howTo: [
      "Report income, resource, and household changes to SSA.",
      `Call SSA at ${SSA_PHONE} or use your my Social Security account.`,
    ],
  },
];

/** Find the rule for an enrolled program key (case-insensitive). */
export function ruleForProgram(program: string): ProgramRule | undefined {
  const p = program.trim().toUpperCase();
  return PROGRAM_RULES.find((r) => r.program.toUpperCase() === p);
}

function endOfUtcDaysAfter(changeDate: Date, days: number): Date {
  const d = new Date(changeDate.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Concrete due date for a change observed on `changeDate`, or null when the
 * program has no fixed calendar date (report promptly, or there is no wage clock).
 */
export function reportingDueDate(program: string, changeDate: Date): Date | null {
  const p = program.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (p === "SSI" || p === "LIS" || p.includes("EXTRA")) {
    return new Date(Date.UTC(changeDate.getUTCFullYear(), changeDate.getUTCMonth() + 1, 10, 23, 59, 59, 999));
  }
  if (p === "SSDI" || p === "DAC" || p === "WIC" || p === "LIHEAP" || p === "VA") return null;
  if (p === "ACA") return endOfUtcDaysAfter(changeDate, 30);
  return endOfUtcDaysAfter(changeDate, 10);
}

/** Earliest concrete deadline among the programs that have one. */
export function soonestReportingDue(programs: string[], changeDate: Date): string | null {
  const dates = programs
    .map((p) => reportingDueDate(p, changeDate))
    .filter((d): d is Date => d != null);
  if (dates.length === 0) return null;
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates[0]!.toISOString();
}
