export type SystemThresholdSeed = {
  systemKey: string;
  program: string;
  state: string | null;
  thresholdType:
    | "monthly_earned_income"
    | "monthly_unearned_income"
    | "annual_income"
    | "asset_balance"
    | "transaction_amount"
    | "custom";
  limitCents: number;
  comparison: "lte" | "lt" | "gte" | "gt";
  warnAtPercent: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  label: string;
  description: string;
  sourceUrl: string;
};

const FROM_2025 = new Date("2025-01-01T00:00:00.000Z");
const FROM_2026 = new Date("2026-01-01T00:00:00.000Z");
const END_2025 = new Date("2025-12-31T23:59:59.999Z");

/**
 * Standard reporting reminder for Pennsylvania programs: most income, asset,
 * household, work, and marital-status changes must be reported within 10 days.
 */
const PA_REPORTING_NOTE =
  " Pennsylvania requires most changes (income, assets, household, work, or marital status) to be reported within 10 days — by the 10th of the month after the month the change occurred.";

const SSA_SGA = "https://www.ssa.gov/oact/cola/sga.html";
const SSA_RESOURCES = "https://www.ssa.gov/ssi/text-resources-ussi.htm";
const PA_HEALTHLAW = "https://www.pahealthlaw.org/";
const PA_DHS = "https://www.dhs.pa.gov/";
const PA_DHS_SNAP = "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx";
const MEDICARE_EXTRA_HELP = "https://www.ssa.gov/medicare/part-d-extra-help";

/**
 * Reference figures used to seed bundled system thresholds.
 *
 * 2026 federal and Pennsylvania eligibility limits were sourced from the
 * "Summary — Eligibility Limits" reference (SSDI/DAC, Medicaid/Waiver, QMB,
 * Medicare Extra Help, SNAP). These are informational ceilings only; SSA, PA
 * DHS, and county assistance offices make the actual eligibility
 * determinations. Verify annually with official sources at the COLA update.
 */
export const SYSTEM_THRESHOLD_SEEDS: SystemThresholdSeed[] = [
  // ---------------------------------------------------------------------------
  // Federal — Social Security (SSDI / DAC / SSI)
  // ---------------------------------------------------------------------------
  {
    systemKey: "ssdi_twp_2025",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1160_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2025,
    effectiveTo: null,
    label: "SSDI — Trial Work Period (monthly gross earnings reference)",
    description:
      "Reference gross earnings level often used with the Trial Work Period. SSA rules are individual; confirm with SSA or a qualified representative.",
    sourceUrl: SSA_SGA,
  },
  {
    // Superseded by the 2026 SGA figure below; kept for historical evaluation.
    systemKey: "ssi_sga_nonblind_2025",
    program: "SSI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1620_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2025,
    effectiveTo: END_2025,
    label: "SSI / SSDI — Substantial Gainful Activity (non-blind, 2025)",
    description:
      "2025 federal SGA reference amount for non-blind individuals. Replaced by the 2026 figure on Jan 1, 2026.",
    sourceUrl: SSA_SGA,
  },
  {
    systemKey: "ssdi_sga_nonblind_2026",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1690_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "SSDI — Substantial Gainful Activity (non-blind, 2026)",
    description:
      "2026 federal SGA ceiling for non-blind individuals: $1,690/month gross earned income. Earning above this (after any Trial Work Period / Extended Period of Eligibility) can end SSDI cash benefits. SSA counts earned income only — not the SSDI payment itself. Disabled Adult Child (DAC) benefits have no earned-income cap, but SGA still governs whether SSA considers the disability ongoing. Report any start/stop of work or change in hours, duties, or pay within 10 days.",
    sourceUrl: SSA_SGA,
  },
  {
    systemKey: "ssi_resources_individual_2025",
    program: "SSI",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 2000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2025,
    effectiveTo: null,
    label: "SSI — Countable resources (individual, reference)",
    description:
      "Federal countable resource limit for an individual. Not all assets count (Special Needs Trusts and ABLE balances are excluded); verify with SSA.",
    sourceUrl: SSA_RESOURCES,
  },
  {
    systemKey: "ssi_resources_couple_2025",
    program: "SSI",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 3000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2025,
    effectiveTo: null,
    label: "SSI — Countable resources (couple, reference)",
    description: "Federal countable resource limit for a couple. Verify exclusions with SSA.",
    sourceUrl: SSA_RESOURCES,
  },

  // ---------------------------------------------------------------------------
  // Federal — Medicare Part D Extra Help / Low-Income Subsidy (2026)
  // ---------------------------------------------------------------------------
  {
    systemKey: "extra_help_lis_income_monthly_2026",
    program: "ACA",
    state: null,
    thresholdType: "monthly_unearned_income",
    limitCents: 2015_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "Medicare Part D Extra Help (LIS) — monthly income (single, 2026)",
    description:
      "2026 monthly income limit for a single individual: $2,015 ($24,180/year). Income from SSDI, DAC, and work all count toward this test. Reference only.",
    sourceUrl: MEDICARE_EXTRA_HELP,
  },
  {
    systemKey: "extra_help_lis_resources_2026",
    program: "ACA",
    state: null,
    thresholdType: "custom",
    limitCents: 18090_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "Medicare Part D Extra Help (LIS) — resource limit (single, 2026)",
    description:
      "2026 asset limit for a single individual: $18,090 (excludes home, car, and personal items). Reference only.",
    sourceUrl: MEDICARE_EXTRA_HELP,
  },

  // ---------------------------------------------------------------------------
  // Pennsylvania — Medicaid HCBS / CHC Waiver (2026)
  // ---------------------------------------------------------------------------
  {
    systemKey: "pa_waiver_income_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 2982_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA HCBS / CHC Waiver — monthly income (2026)",
    description:
      "2026 waiver income limit: $2,982/month (300% of the SSI Federal Benefit Rate). Only the applicant's income counts; SSDI and wages count, but DAC benefits are excluded (PA is a 1634 state). Waiver approval confers full Medicaid (\"deemed eligible\"), so ABD income limits do not apply. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_HEALTHLAW,
  },
  {
    systemKey: "pa_waiver_resources_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "custom",
    limitCents: 8000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA HCBS / CHC Waiver — asset limit (2026)",
    description:
      "2026 waiver asset limit: $8,000 (higher for married applicants under spousal-impoverishment rules). Special Needs Trusts and ABLE balances are excluded. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_HEALTHLAW,
  },

  // ---------------------------------------------------------------------------
  // Pennsylvania — Full Medicaid (ABD / Healthy Horizons) (2026)
  // ---------------------------------------------------------------------------
  {
    systemKey: "pa_medicaid_abd_income_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 1330_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA Full Medicaid (ABD / Healthy Horizons) — monthly income (2026)",
    description:
      "2026 Aged/Blind/Disabled Medicaid income limit: $1,330/month (single). SSDI counts as unearned income (less the $20 exclusion); earned income gets the $65 + ½ exclusions; DAC is excluded. Waiver enrollees exceed this but keep Medicaid via deemed eligibility. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_medicaid_abd_resources_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "custom",
    limitCents: 2000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA Full Medicaid (ABD) — asset limit (2026)",
    description:
      "2026 ABD Medicaid asset limit: $2,000 (individual). Note: $8,000 may apply when Medicaid was entered through a waiver. SNT and ABLE balances are excluded. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_mawd_resources_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "custom",
    limitCents: 8000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA MAWD (Workers with Disabilities) — asset limit (2026)",
    description:
      "Medical Assistance for Workers with Disabilities asset limit: $8,000 ($2,400 income-based tier). MAWD lets a working beneficiary keep Medicaid/Waiver coverage above SSDI's SGA limit, for a premium of ~5% of countable income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },

  // ---------------------------------------------------------------------------
  // Pennsylvania — Qualified Medicare Beneficiary (QMB)
  // ---------------------------------------------------------------------------
  {
    systemKey: "pa_qmb_income_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 1350_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA QMB (Medicare Savings Program) — monthly income (single)",
    description:
      "QMB income limit: 100% FPL + $20 disregard ≈ $1,350/month (single). QMB pays Medicare Part A/B premiums and cost-sharing and does not block Waiver services. SSDI counts (less $20); earned income gets the $65 + ½ exclusions. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_qmb_resources_2026",
    program: "Medicaid",
    state: "PA",
    thresholdType: "custom",
    limitCents: 9660_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA QMB (Medicare Savings Program) — resource limit (single)",
    description:
      "QMB resource limit ≈ $9,660 (single). Applies regardless of Waiver enrollment or SSDI status. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },

  // ---------------------------------------------------------------------------
  // Pennsylvania — SNAP (2025–2026), gross income test at 200% FPL by HH size
  // ---------------------------------------------------------------------------
  {
    systemKey: "pa_snap_gross_hh1_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 2610_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 1 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 1-person household: $2,610. Gross income includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh2_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 3534_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 2 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 2-person household: $3,534. Includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh3_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 4458_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 3 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 3-person household: $4,458. Includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh4_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 5360_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 4 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 4-person household: $5,360. Includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh5_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 6284_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 5 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 5-person household: $6,284. Includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh6_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 7208_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 6+ (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 6-or-more-person household: $7,208 (add ~$924 per additional person). Includes SSDI, DAC, and earned income. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_resources_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "custom",
    limitCents: 4250_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — resource limit (elderly/disabled, if gross test failed)",
    description:
      "Most PA households have no SNAP asset limit. The $4,250 federal resource limit applies only to households with an elderly or disabled member that fail the gross-income test. Reference only." +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
];

export function thresholdSeedToDoc(seed: SystemThresholdSeed): Record<string, unknown> {
  return {
    scope: "system",
    ownerUserId: null,
    beneficiaryId: null,
    systemKey: seed.systemKey,
    program: seed.program,
    state: seed.state,
    thresholdType: seed.thresholdType,
    limitCents: seed.limitCents,
    comparison: seed.comparison,
    warnAtPercent: seed.warnAtPercent,
    effectiveFrom: seed.effectiveFrom,
    effectiveTo: seed.effectiveTo,
    label: seed.label,
    description: seed.description,
    sourceUrl: seed.sourceUrl,
  };
}
