/**
 * Eligibility-loss warning scenarios derived from Frank Rapoport’s PA benefits
 * guides (Eligibility Guide V3, SummaryEligibilityLimits V3, Graham Guardrail)
 * and the Jul 2026 product asks. Used for alert copy, settings prefs, and the
 * Resources reference. Auto-detectable scenarios are evaluated in
 * evaluate-scenario-alerts.ts; the rest are educational warnings.
 */

export type ScenarioAlertTrigger = "cliff" | "reporting" | "snt" | "able";

export type EligibilityLossScenario = {
  id: string;
  /** Short title shown in alerts / catalog. */
  title: string;
  /** Programs this cliff mainly affects. */
  programs: string[];
  /** Notification-pref bucket. */
  trigger: ScenarioAlertTrigger;
  level: "warning" | "breach" | "info";
  /** One-line loss risk. */
  risk: string;
  /** What to do / report. */
  action: string;
  /** When true, evaluate-scenario-alerts may emit a live alert. */
  autoDetect: boolean;
};

export const ELIGIBILITY_LOSS_SCENARIOS: EligibilityLossScenario[] = [
  // —— SSDI / DAC ——
  {
    id: "ssdi_sga_after_twp",
    title: "SSDI cash cliff after Trial Work Period",
    programs: ["SSDI"],
    trigger: "cliff",
    level: "breach",
    risk: "Gross earnings at or above SGA ($1,690/mo non-blind, 2026) after the 9-month TWP can drop the SSDI check to $0.",
    action: "Report work start/stop, hours, duties, and pay to SSA by the 10th of the next month. Ask about EPE / IRWE / MAWD if Medicaid is at risk.",
    autoDetect: true,
  },
  {
    id: "ssdi_twp_service_month",
    title: "Trial Work Period service month",
    programs: ["SSDI"],
    trigger: "cliff",
    level: "warning",
    risk: "Gross earnings ≥ $1,210/mo (2026) count as a TWP service month — 9 months in a rolling 60-month window.",
    action: "Track TWP months used. Report work changes to SSA within 10 days (by the 10th of the following month).",
    autoDetect: true,
  },
  {
    id: "dac_sga_disability",
    title: "DAC — earnings threaten disability status",
    programs: ["DAC"],
    trigger: "cliff",
    level: "warning",
    risk: "DAC has no separate wage cap, but earnings above SGA can end the disability finding and stop DAC.",
    action: "Report work to SSA. Keep medical evidence current. Marriage can also end DAC unless marrying another Title II beneficiary.",
    autoDetect: true,
  },
  {
    id: "dac_marriage",
    title: "DAC ended by marriage",
    programs: ["DAC"],
    trigger: "reporting",
    level: "warning",
    risk: "Marrying someone who is not a Title II beneficiary generally ends DAC.",
    action: "Report marital-status changes to SSA by the 10th of the next month before relying on DAC continuing.",
    autoDetect: false,
  },
  {
    id: "ssdi_medical_improvement",
    title: "Medical improvement / stopping treatment",
    programs: ["SSDI", "DAC"],
    trigger: "reporting",
    level: "info",
    risk: "Medical improvement or stopping prescribed treatment can trigger a continuing-disability review.",
    action: "Report medical changes to SSA. Keep treating-source records in the Vault under Proof of disability.",
    autoDetect: false,
  },

  // —— SSI ——
  {
    id: "ssi_countable_income_fbr",
    title: "SSI cash reduced to $0 near FBR",
    programs: ["SSI"],
    trigger: "cliff",
    level: "breach",
    risk: "When countable income reaches the Federal Benefit Rate ($994 individual, 2026), the SSI check falls to $0.",
    action: "Review earned vs unearned counting ($20 / $65 / ½). Report income changes to SSA within 10 days.",
    autoDetect: true,
  },
  {
    id: "ssi_resources_2k",
    title: "SSI resource limit ($2,000)",
    programs: ["SSI"],
    trigger: "cliff",
    level: "breach",
    risk: "Countable resources over $2,000 can suspend SSI. Home, one car, properly structured SNT, and ABLE are usually excluded.",
    action: "Move excess to ABLE/SNT when appropriate. Report resource changes; confirm exclusions with SSA.",
    autoDetect: true,
  },
  {
    id: "ssi_snt_cash",
    title: "SNT cash paid to the beneficiary",
    programs: ["SSI"],
    trigger: "snt",
    level: "breach",
    risk: "Cash from an SNT is unearned income — dollar-for-dollar after the $20 general exclusion.",
    action: "Avoid cash distributions. Prefer vendor payments. Report any cash received to SSA.",
    autoDetect: false,
  },
  {
    id: "ssi_snt_shelter_ism",
    title: "SNT shelter → ISM (PMV cap)",
    programs: ["SSI"],
    trigger: "snt",
    level: "warning",
    risk: "Rent/mortgage/property tax/gas/electric/water paid by an SNT to a vendor is ISM, capped at PMV (⅓ FBR + $20 ≈ $351.33 in 2026; ~$331 net reduction).",
    action: "Budget for the capped SSI reduction. Use the SNT estimator on Limits → SSI. Food/internet/phone/cable/tuition to vendors are excluded.",
    autoDetect: false,
  },
  {
    id: "ssi_able_100k",
    title: "ABLE balance over $100,000",
    programs: ["SSI", "ABLE"],
    trigger: "able",
    level: "breach",
    risk: "SSI cash suspends while ABLE countable cash exceeds $100,000; Medicaid can continue.",
    action: "Watch ABLE statements in the Vault. Plan distributions before crossing $100k if SSI cash is needed.",
    autoDetect: false,
  },
  {
    id: "ssi_age18_redetermination",
    title: "Age-18 SSI adult redetermination",
    programs: ["SSI"],
    trigger: "cliff",
    level: "warning",
    risk: "At 18, SSA applies the adult disability standard. Losing SSI can also end J-category Medicaid.",
    action: "Prepare adult function evidence (SSA-3373). Check MAGI Medicaid / MAWD / waiver as backups.",
    autoDetect: false,
  },
  {
    id: "ssi_student_exclusion_ends",
    title: "Student earned-income exclusion ends",
    programs: ["SSI"],
    trigger: "cliff",
    level: "warning",
    risk: "Student Earned Income Exclusion (up to $2,410/mo / $9,730/yr in 2026) ends when the student turns 22 or leaves school.",
    action: "Recalculate countable wages without the exclusion. Report school status changes to SSA.",
    autoDetect: false,
  },

  // —— Medicaid ABD / Waiver / MAWD ——
  {
    id: "abd_income_limit",
    title: "ABD / Healthy Horizons income limit",
    programs: ["Medicaid"],
    trigger: "cliff",
    level: "warning",
    risk: "Full ABD Medicaid income ceiling is about $1,350/mo (100% FPL + $20) for a single adult — SSI-related counting applies.",
    action: "If over ABD but under waiver ($2,982) or MAWD ($3,325), confirm category with CAO/COMPASS.",
    autoDetect: true,
  },
  {
    id: "abd_resources_2k",
    title: "ABD Medicaid resource limit",
    programs: ["Medicaid"],
    trigger: "cliff",
    level: "warning",
    risk: "Standard ABD countable resources are capped near $2,000 ($8,000 if Medicaid entered through a waiver).",
    action: "Report balance spikes within 10 days. Prefer ABLE/SNT for excess liquid funds.",
    autoDetect: true,
  },
  {
    id: "waiver_income_2982",
    title: "HCBS / CHC Waiver income ceiling",
    programs: ["Medicaid"],
    trigger: "cliff",
    level: "breach",
    risk: "2026 waiver income limit is $2,982/mo (300% FBR). Only the applicant’s income counts; DAC is often excluded in PA (1634).",
    action: "Report income changes via COMPASS/CAO within 10 days. Keep waiver approval letters in the Vault.",
    autoDetect: true,
  },
  {
    id: "ssdi_waiver_twilight",
    title: "SSDI lost, Waiver still safe (twilight zone)",
    programs: ["SSDI", "Medicaid"],
    trigger: "cliff",
    level: "warning",
    risk: "Earnings can end SSDI cash (SGA) while still leaving room under the $2,982 waiver income limit.",
    action: "Report work to SSA. Ask CAO about MAWD to keep Medicaid/Waiver with a premium (~5% of countable income).",
    autoDetect: true,
  },
  {
    id: "mawd_transition",
    title: "MAWD safety net when working",
    programs: ["Medicaid"],
    trigger: "cliff",
    level: "info",
    risk: "MAWD allows higher income (250% FPL ≈ $3,325; up to 600% FPL after 12 months on Job Success) but requires paid work and a premium.",
    action: "If wages threaten SSDI/ABD, ask CAO about MAWD before coverage gaps. Volunteer work does not qualify.",
    autoDetect: true,
  },

  // —— MAGI 2027 ——
  {
    id: "magi_work_requirements_2027",
    title: "MAGI Medicaid 80-hour work rule (2027)",
    programs: ["Medicaid"],
    trigger: "reporting",
    level: "warning",
    risk: "Starting Jan 1, 2027, expansion adults 19–64 must report 80 hrs/mo (or qualify for an exemption) or risk disenrollment and marketplace subsidy lockout.",
    action: "Log hours in Resources → Medicaid work requirements. Keep timesheets in Vault → Work & activity. Report via COMPASS/CAO.",
    autoDetect: false,
  },
  {
    id: "magi_semiannual_renewal_2027",
    title: "MAGI semi-annual renewal (2027)",
    programs: ["Medicaid"],
    trigger: "reporting",
    level: "warning",
    risk: "MAGI expansion adults shift to 6-month renewals in 2027. Missing a renewal ends coverage.",
    action: "Track renewal dates in COMPASS. DHS outreach begins ~Sept 2026. Does not apply to Waiver/SSI disability categories.",
    autoDetect: false,
  },

  // —— QMB / Extra Help ——
  {
    id: "qmb_income_resources",
    title: "QMB income or resource limit",
    programs: ["QMB"],
    trigger: "cliff",
    level: "warning",
    risk: "QMB (≈ $1,350 income / ~$9,660–$9,950 resources, single) pays Medicare premiums and cost-sharing — separate from full Medicaid.",
    action: "Report income/resource changes within 10 days. Waiver enrollment does not block QMB.",
    autoDetect: true,
  },
  {
    id: "extra_help_income",
    title: "Medicare Extra Help (LIS) income/resources",
    programs: ["ExtraHelp"],
    trigger: "cliff",
    level: "warning",
    risk: "2026 Extra Help single limits ≈ $2,015/mo income and $18,090 resources (SSDI, DAC, and wages all count).",
    action: "Report changes to SSA by the 10th of the next month.",
    autoDetect: true,
  },

  // —— SNAP ——
  {
    id: "snap_gross_200_fpl",
    title: "SNAP gross income over 200% FPL",
    programs: ["SNAP"],
    trigger: "cliff",
    level: "breach",
    risk: "PA SNAP uses a 200% FPL gross test (≈ $2,610 HH1). Crossing it is a 10-day reportable change.",
    action: "Report to CAO/COMPASS within 10 days. Other changes often wait for SAR/renewal.",
    autoDetect: true,
  },
  {
    id: "snap_work_exemption_lost",
    title: "SNAP work exemption lost",
    programs: ["SNAP"],
    trigger: "reporting",
    level: "warning",
    risk: "Losing disability status, dropping below required hours, or leaving school/training can end a work exemption.",
    action: "Report exemption-ending changes within 10 days.",
    autoDetect: false,
  },

  // —— Cross-cutting reporting ——
  {
    id: "reporting_wage_change_10day",
    title: "Wage change — 10-day reporting clock",
    programs: ["SSI", "SSDI", "DAC", "Medicaid", "SNAP", "QMB"],
    trigger: "reporting",
    level: "warning",
    risk: "Most PA/SSA income and work changes must be reported by the 10th of the month after the change month.",
    action: "File with SSA and/or COMPASS/CAO. Keep gross pay stubs in Vault → Job & income.",
    autoDetect: true,
  },
  {
    id: "reporting_lump_sum",
    title: "Lump-sum / inheritance / settlement",
    programs: ["SSI", "Medicaid"],
    trigger: "reporting",
    level: "breach",
    risk: "Lump sums can push resources over $2,000 for SSI/ABD in the month received.",
    action: "Report within 10 days. Ask counsel about first-party SNT or ABLE before depositing to checking.",
    autoDetect: false,
  },
  {
    id: "reporting_household_change",
    title: "Household composition change",
    programs: ["SNAP", "Medicaid", "SSI"],
    trigger: "reporting",
    level: "warning",
    risk: "Someone moving in/out, a child turning 22, or a spouse joining can change SNAP/Medicaid household size and deeming.",
    action: "Report household changes within 10 days where required (SNAP lists this as immediate).",
    autoDetect: false,
  },
  {
    id: "ssdi_snt_shelter_ok",
    title: "SNT shelter while on SSDI (not SSI)",
    programs: ["SSDI"],
    trigger: "snt",
    level: "info",
    risk: "SSDI has no ISM reduction — vendor-paid shelter/food from a third-party SNT generally does not count as personal income if the trust stays titled owner.",
    action: "Still report wages. Do not assume the same rule if the person also receives SSI.",
    autoDetect: false,
  },
  {
    id: "overpayment_unreported_change",
    title: "Overpayment from late reporting",
    programs: ["SSI", "SSDI", "Medicaid", "SNAP"],
    trigger: "reporting",
    level: "warning",
    risk: "Late or missing reports commonly create overpayment demands even when the person remains eligible after recalculation.",
    action: "When in doubt, report early. Keep dated proof of what was filed (Vault → Agency correspondence).",
    autoDetect: false,
  },
  {
    id: "ssi_1619b_medicaid_while_zero",
    title: "1619(b) — Medicaid while SSI cash is $0",
    programs: ["SSI", "Medicaid"],
    trigger: "cliff",
    level: "info",
    risk: "When earned income zeros the SSI check, 1619(b) can keep Medicaid if other 1619(b) tests are met — losing SSI cash is not automatically losing medical coverage.",
    action: "Ask SSA/CAO whether 1619(b) applies before assuming Medicaid ends with the cash benefit.",
    autoDetect: false,
  },
  {
    id: "medicaid_renewal_packet",
    title: "Medicaid renewal packet due",
    programs: ["Medicaid"],
    trigger: "reporting",
    level: "warning",
    risk: "PA DHS mails a reminder ~90 days before renewal; a pink packet arrives closer to the due date. Missing it ends coverage until re-approved.",
    action: "Check the exact date in COMPASS. Upload the completed packet to Vault → Agency correspondence.",
    autoDetect: false,
  },
];

export const SCENARIO_ALERT_TRIGGERS: ScenarioAlertTrigger[] = ["cliff", "reporting", "snt", "able"];

export function scenarioById(id: string): EligibilityLossScenario | undefined {
  return ELIGIBILITY_LOSS_SCENARIOS.find((s) => s.id === id);
}

export function scenariosForPrograms(programs: string[]): EligibilityLossScenario[] {
  const keys = new Set(programs.map((p) => p.toUpperCase()));
  return ELIGIBILITY_LOSS_SCENARIOS.filter((s) =>
    s.programs.some((p) => keys.has(p.toUpperCase()) || (p === "ExtraHelp" && keys.has("EXTRAHELP"))),
  );
}
