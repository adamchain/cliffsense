/**
 * Per-program reporting guidance. When the bank sync detects a change (a new
 * income source, an income jump, or crossing a limit), the Action Center uses
 * these rules to tell the user what to report, to whom, and by when — prompt +
 * how-to + deadline. Informational only; not legal advice or a determination.
 *
 * Pennsylvania-focused: PA DHS programs require reporting most changes within
 * 10 days (by the 10th of the month after the change).
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
    deadlineNote: "Report work and earnings to SSA promptly — generally within 10 days of the change.",
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
    deadlineNote: "PA requires reporting within 10 days — by the 10th of the month after the change.",
    howTo: [
      "Report through COMPASS (compass.state.pa.us) or the myCOMPASS PA app.",
      `Or call the Statewide Customer Service Center at ${PA_DHS_PHONE}, or your County Assistance Office.`,
      "Have recent pay stubs or an offer letter ready.",
    ],
  },
  {
    program: "Medicaid",
    short: "Medicaid",
    agency: "PA County Assistance Office",
    reportsNewWork: true,
    reportsIncomeChange: true,
    reportsAssetChange: true,
    reportUrl: COMPASS,
    phone: PA_DHS_PHONE,
    deadlineNote: "PA requires reporting income, asset, household, or work changes within 10 days.",
    howTo: [
      "Report through COMPASS (compass.state.pa.us) or the myCOMPASS PA app.",
      `Or call ${PA_DHS_PHONE}, or your County Assistance Office caseworker.`,
      "If a Special Needs Trust or ABLE account holds the funds, note that — those resources are excluded.",
    ],
  },
];

/** Find the rule for an enrolled program key (case-insensitive). */
export function ruleForProgram(program: string): ProgramRule | undefined {
  const p = program.trim().toUpperCase();
  return PROGRAM_RULES.find((r) => r.program.toUpperCase() === p);
}

/**
 * PA-style reporting deadline for a change that happened in the current month:
 * the 10th of the following month. Returned as a UTC date.
 */
export function reportingDeadline(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 10, 23, 59, 59, 999));
}
