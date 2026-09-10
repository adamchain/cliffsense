import { SSI_FBR_INDIVIDUAL_CENTS } from "@/lib/benefits/ssi";

export type SystemThresholdSeed = {
  systemKey: string;
  program: string;
  state: string | null;
  thresholdType:
    | "monthly_earned_income"
    | "monthly_unearned_income"
    | "monthly_gross_income"
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

/** Suffix appended to every estimated (non-determinative) limit description. */
const ESTIMATE_NOTE =
  " Estimated from your linked accounts — informational only, not an eligibility determination.";

const SSA_SGA = "https://www.ssa.gov/oact/cola/sga.html";
const SSA_RESOURCES = "https://www.ssa.gov/ssi/text-resources-ussi.htm";
const SSA_REDBOOK = "https://www.ssa.gov/redbook/";
const PA_HEALTHLAW = "https://www.pahealthlaw.org/";
const PA_DHS = "https://www.dhs.pa.gov/";
const PA_DHS_SNAP = "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx";
const PA_DHS_TANF = "https://www.dhs.pa.gov/Services/Assistance/Pages/Cash-Assistance.aspx";
const PA_DHS_LIHEAP = "https://www.dhs.pa.gov/Services/Assistance/Pages/LIHEAP.aspx";
const PA_WIC = "https://www.pawic.com/";
const PENNIE = "https://www.pennie.com/";
const VA_PENSION = "https://www.va.gov/pension/eligibility/";
const PA_ABLE = "https://www.paable.gov/";
const MEDICARE_EXTRA_HELP = "https://www.ssa.gov/medicare/part-d-extra-help";

/**
 * Reference figures used to seed bundled system thresholds.
 *
 * 2026 federal and Pennsylvania eligibility limits were sourced from the
 * "Complete Benefits Breakdown — Pennsylvania, 2026" reference (SSA Red Book /
 * 2026 COLA, USDA FNS FY2026 SNAP, HHS/ASPE 2026 poverty guidelines, VA 2026 rate tables, IRS/CRS 2026 ACA, and PA DHS / PA Dept. of Health
 * program charts). These are informational ceilings only; SSA, PA DHS, VA,
 * and county assistance offices make the actual eligibility determinations.
 * Verify annually with official sources at each program's update cycle.
 *
 * 2026 Federal Poverty Level (single, 48 states incl. PA): $15,960/yr =
 * $1,330/mo. FPL multiples used below: 138% ≈ $1,836/mo, 150% ≈ $1,995/mo,
 * 185% ≈ $2,461/mo, 200% ≈ $2,609/mo, 250% ≈ $3,325/mo. Household-varying limits
 * are seeded at the household-of-1 figure and labeled "(single)" unless a
 * per-size variant is provided (SNAP gross income).
 */
export const SYSTEM_THRESHOLD_SEEDS: SystemThresholdSeed[] = [
  // ===========================================================================
  // 1. SSI — Supplemental Security Income (federal, SSA)
  // ===========================================================================
  {
    systemKey: "ssi_countable_income_2026",
    program: "SSI",
    state: null,
    thresholdType: "monthly_unearned_income",
    limitCents: SSI_FBR_INDIVIDUAL_CENTS,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "SSI — countable income (benefit reaches $0 near here, 2026)",
    description:
      "2026 Federal Benefit Rate (FBR) for an individual: $994/month. SSI pays FBR minus countable income, so once countable income reaches ~$994 the cash benefit falls to $0 (break-even is roughly $1,014/mo unearned or $2,073/mo earned for an individual). Countable income applies the $20 general and $65 earned exclusions and halves remaining wages; SNAP, most refunds, and ABLE deposits don't count. PA adds a small State Supplementary Payment on top." +
      ESTIMATE_NOTE,
    sourceUrl: SSA_REDBOOK,
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
    label: "SSI — countable resources (individual)",
    description:
      "Federal countable resource limit for an individual: $2,000 (statutory, unchanged since 1989). Excluded: your home, one vehicle, household goods, burial funds up to $1,500, and up to $100,000 in an ABLE account. Qualifying SNT balances are excluded as resources, but cash the trustee deposits into a personal checking/savings account is generally unearned income in the month received and can become a countable resource the next month. Hard cutoff — if countable resources exceed the limit on the first day of a month, you're ineligible for that whole month." +
      ESTIMATE_NOTE,
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
    label: "SSI — countable resources (couple)",
    description:
      "Federal countable resource limit for an eligible couple: $3,000. Same exclusions as the individual limit (home, one vehicle, household goods, burial funds, ABLE up to $100,000). Verify exclusions with SSA." +
      ESTIMATE_NOTE,
    sourceUrl: SSA_RESOURCES,
  },
  {
    // Superseded by the 2026 SGA figure (which now lives under SSDI); kept for
    // historical evaluation of 2025 months.
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
      "2025 federal SGA reference amount for non-blind individuals: $1,620/month. Replaced by the 2026 figure on Jan 1, 2026.",
    sourceUrl: SSA_SGA,
  },

  // ===========================================================================
  // 2. SSDI — Social Security Disability Insurance (federal, SSA)
  //    No income or asset limit to receive it; SGA/TWP govern "disabled enough".
  // ===========================================================================
  {
    // Superseded by the 2026 TWP figure below; kept for historical evaluation.
    systemKey: "ssdi_twp_2025",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1160_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2025,
    effectiveTo: END_2025,
    label: "SSDI — Trial Work Period service month (2025)",
    description:
      "2025 monthly gross earnings that count a month as a Trial Work Period 'service month': $1,160. Replaced by the 2026 figure on Jan 1, 2026.",
    sourceUrl: SSA_SGA,
  },
  {
    systemKey: "ssdi_twp_2026",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1210_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "SSDI — Trial Work Period service month (2026)",
    description:
      "2026 Trial Work Period (TWP) trigger: a month counts as a 'service month' if you earn $1,210 or more gross (or work 80+ self-employed hours). You get 9 service months in a rolling 60-month window — full SSDI continues no matter how high earnings go in those months. After the 9 months, the Extended Period of Eligibility begins and SGA governs payment. Report any work start/stop or change in hours, duties, or pay within 10 days." +
      ESTIMATE_NOTE,
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
      "2026 federal SGA ceiling for non-blind individuals: $1,690/month gross earned income. Earning above this (after any Trial Work Period / Extended Period of Eligibility) can suspend SSDI cash benefits for that month. SSA counts earned income only — not the SSDI payment itself — and IRWE, employer subsidies, and self-employment expenses lower countable earnings. Disabled Adult Child (DAC) benefits have no earned-income cap, but SGA still governs whether SSA considers the disability ongoing. Report any start/stop of work within 10 days." +
      ESTIMATE_NOTE,
    sourceUrl: SSA_SGA,
  },
  {
    systemKey: "ssdi_sga_blind_2026",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 2830_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "SSDI — Substantial Gainful Activity (blind, 2026)",
    description:
      "2026 federal SGA ceiling for statutorily blind individuals: $2,830/month gross earned income — higher than the non-blind limit. Only earned income counts; the SSDI payment itself does not. Report work and earnings changes within 10 days." +
      ESTIMATE_NOTE,
    sourceUrl: SSA_SGA,
  },

  // ===========================================================================
  // 3. SNAP — food assistance (PA ACCESS Card, BBCE: gross limit at 200% FPL)
  // ===========================================================================
  {
    systemKey: "pa_snap_gross_hh1_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 2610_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 1 (200% FPL)",
    description:
      "PA Broad-Based Categorical Eligibility (BBCE) raises the SNAP gross-income limit to 200% FPL and removes the asset test for most households. Household of 1: $2,610/month gross. Gross income includes SSDI, DAC, wages, VA benefits, and pensions. The net-income test (100% FPL) must still be met after deductions. A recurring SNT cash distribution available to the household can be SNAP income; a one-time lump sum is classified separately." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh2_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 3534_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 2 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 2-person household: $3,534. Includes SSDI, DAC, and earned income." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh3_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 4458_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 3 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 3-person household: $4,458. Includes SSDI, DAC, and earned income." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh4_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 5360_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 4 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 4-person household: $5,360. Includes SSDI, DAC, and earned income." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh5_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 6284_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 5 (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 5-person household: $6,284 (add ~$924 per additional person). Includes SSDI, DAC, and earned income." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_gross_hh6_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 7208_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — gross monthly income, household of 6+ (200% FPL)",
    description:
      "Gross monthly income limit (200% FPL) for a 6-or-more-person household: $7,208 (add ~$924 per additional person). Includes SSDI, DAC, and earned income." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },
  {
    systemKey: "pa_snap_resources_2026",
    program: "SNAP",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 4250_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA SNAP — resource limit (elderly/disabled, if gross test failed)",
    description:
      "Most PA households have NO SNAP asset limit under BBCE. The $4,250 federal resource limit applies only to a household with a member 60+ or disabled that is over the 200% FPL gross limit and instead qualifies under federal rules (which waive the gross-income test but apply an asset test)." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_SNAP,
  },

  // ===========================================================================
  // 4. Medicaid categories — pick the enrolled type; limits are not interchangeable
  // ===========================================================================
  {
    systemKey: "pa_medicaid_magi_adult_2026",
    program: "MedicaidMAGI",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 1836_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA MAGI Medicaid (adults 19–64) — monthly income (138% FPL, 2026)",
    description:
      "ACA-expansion adults (19–64): income limit 138% FPL ≈ $1,836/month (single, includes the 5% disregard). MAGI counting — roughly tax AGI plus non-taxable Social Security and tax-exempt interest — and NO asset test for children, pregnant people, parents, or expansion adults. People under 138% FPL go to Medicaid rather than Marketplace subsidies. SSI recipients are automatically eligible." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_waiver_income_2026",
    program: "MedicaidWaiver",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 2982_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA HCBS / CHC Waiver — monthly income (2026)",
    description:
      "2026 long-term-care / waiver income limit: $2,982/month (300% of the SSI Federal Benefit Rate). Only the applicant's income counts; SSDI and wages count, but DAC benefits are excluded (PA is a 1634 state). Waiver approval confers full Medicaid (\"deemed eligible\"), so ABD income limits do not apply. Qualifying SNT balances are excluded; cash released to a personal bank account can count as income/resources for the waiver category." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_HEALTHLAW,
  },
  {
    systemKey: "pa_waiver_resources_2026",
    program: "MedicaidWaiver",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 8000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA HCBS / CHC Waiver — asset limit (2026)",
    description:
      "2026 waiver asset limit: $8,000 (higher if married under spousal impoverishment rules). A 5-year (60-month) look-back applies to asset transfers. Special Needs Trusts and ABLE balances are excluded while the funds remain in the trust/ABLE account; cash deposited to a personal account is no longer automatically excluded." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_HEALTHLAW,
  },
  {
    systemKey: "pa_medicaid_abd_income_2026",
    program: "MedicaidABD",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 1330_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA ABD / Healthy Horizons Medicaid — monthly income (2026)",
    description:
      "2026 ABD (Aged/Blind/Disabled) Healthy Horizons income limit: $1,330/month for a single disabled adult. SSDI counts as unearned income (less the $20 exclusion); earned income gets the $65 + ½ exclusions; DAC is excluded in Pennsylvania. If you're over this, you may spend down to the Medically Needy Income Limit ($425/mo single) on medical bills. Waiver enrollees can exceed this and still keep Medicaid via deemed eligibility." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_medicaid_abd_resources_2026",
    program: "MedicaidABD",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 2000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA ABD Medicaid — asset limit (2026)",
    description:
      "2026 ABD Medicaid asset limit: $2,000 (individual). $8,000 may apply when Medicaid was entered through a waiver. Excluded: primary home, one vehicle, household goods, qualifying SNT and ABLE balances. Cash from an SNT into a personal bank account can count toward this limit if retained past the receipt month." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_mawd_income_2026",
    program: "MAWD",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 3325_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA MAWD — countable monthly income (250% FPL, 2026)",
    description:
      "Medical Assistance for Workers with Disabilities countable-income limit: 250% FPL = $3,325/month (single). This is a countable-income test, not a gross-wage cap — apply the $20 general exclusion, $65 earned-income exclusion, then only one-half of remaining wages, plus applicable disability/work-expense deductions. Do not compare a gross paycheck to $3,325. Paid employment is required. Standard MAWD charges a monthly premium of about 5% of countable income. You can keep Waiver services on MAWD." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_mawd_resources_2026",
    program: "MAWD",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 10000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA MAWD — asset limit (2026)",
    description:
      "MAWD countable resource limit: $10,000. Uses Medicaid/SSI-related exclusions (principal residence, an allowable vehicle, qualifying SNT and ABLE balances). A direct SNT cash distribution may be unearned income in the receipt month and a resource if kept in a personal account." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_mawd_job_success_income_2026",
    program: "MAWD",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 7980_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA MAWD Workers with Job Success — countable income (600% FPL, 2026)",
    description:
      "Pennsylvania's Workers with Job Success pathway can extend MAWD-related coverage above the standard 250% FPL level, up to 600% FPL (about $7,980/month countable for a single person in 2026) if the separate requirements are met. This is a continuation ceiling, not the standard MAWD test." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_medicaid_mnil_2026",
    program: "MedicaidABD",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 425_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA ABD Medicaid — Medically Needy 'spend-down' limit (single, 2026)",
    description:
      "Medically Needy Income Limit (MNIL) for spend-down: $425/month (single) / $442 (couple) over a 6-month period. If your income is over the ABD limit, you become eligible by spending the difference ('deductible') on medical bills. This is a reference floor, not a cliff — being above it isn't a loss of coverage, it sets your spend-down amount." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_qmb_income_2026",
    program: "QMB",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 1350_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA QMB (Medicare Savings Program) — monthly income (single)",
    description:
      "QMB income limit: 100% FPL + $20 disregard ≈ $1,350/month (single). QMB pays Medicare Part A/B premiums and cost-sharing and does not block Waiver services. SSDI counts (less $20); earned income gets the $65 + ½ exclusions. Cash from an SNT into a personal account must be reviewed under QMB income rules — SSDI's no-asset rule does not carry over." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },
  {
    systemKey: "pa_qmb_resources_2026",
    program: "QMB",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 9660_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA QMB (Medicare Savings Program) — resource limit (single)",
    description:
      "QMB resource limit ≈ $9,660 (single); some PA Healthy Horizons charts list about $9,950 (2× the SSI resource standard). Applies regardless of Waiver enrollment or SSDI status. Qualifying SNT/ABLE balances are excluded; retained personal-account cash counts." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS,
  },

  // ===========================================================================
  // 5. TANF — cash assistance (PA, Group 2 figures incl. Philadelphia)
  // ===========================================================================
  {
    systemKey: "pa_tanf_income_g2_2026",
    program: "TANF",
    state: "PA",
    thresholdType: "monthly_unearned_income",
    limitCents: 403_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA TANF — 'needy' income limit, family of 3, Group 2 (2026)",
    description:
      "PA TANF benefit levels are tiered by geographic group; Group 2 (includes Philadelphia) pays a max grant of ~$205 (1 person) to ~$403 (family of 3). A family of 3 is considered 'needy' if countable income is under ~$403/month. Once on TANF, only half your earned wages count (50% earned-income disregard). This row uses the family-of-3 figure — your limit scales with family size and geographic group." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_TANF,
  },
  {
    systemKey: "pa_tanf_resources_2026",
    program: "TANF",
    state: "PA",
    thresholdType: "asset_balance",
    limitCents: 1000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA TANF — resource (asset) limit (2026)",
    description:
      "TANF resource limit: $1,000, regardless of family size. Counts property like rental real estate and a second car. There's a 60-month (5-year) lifetime limit on TANF for an adult head-of-household; extended TANF exists for those who hit 60 months but meet criteria (disability, caring for a disabled household member, child under 12 months, etc.)." +
      ESTIMATE_NOTE +
      PA_REPORTING_NOTE,
    sourceUrl: PA_DHS_TANF,
  },

  // ===========================================================================
  // 7. WIC — Women, Infants & Children (PA Dept. of Health)
  // ===========================================================================
  {
    systemKey: "pa_wic_income_185_2026",
    program: "WIC",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 2461_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA WIC — gross monthly income (185% FPL, single)",
    description:
      "WIC income limit: 185% FPL ≈ $2,461/month (single; ~$5,089/mo for a family of 4). Adjunctive eligibility — if you already get SNAP, Medicaid, or TANF, you automatically meet the WIC income test. WIC also requires being at nutritional risk (assessed at the clinic) and covers pregnant/postpartum/breastfeeding people, infants, and children up to age 5. WIC is not cash and does not reduce SNAP." +
      ESTIMATE_NOTE,
    sourceUrl: PA_WIC,
  },

  // ===========================================================================
  // 8. LIHEAP — Low-Income Home Energy Assistance (PA DHS)
  // ===========================================================================
  {
    systemKey: "pa_liheap_income_150_2026",
    program: "LIHEAP",
    state: "PA",
    thresholdType: "monthly_gross_income",
    limitCents: 1995_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "PA LIHEAP — gross monthly income (150% FPL, single)",
    description:
      "LIHEAP income limit: 150% FPL ≈ $1,995/month (single; ~$4,100/mo for a family of 4). Helps pay heating costs via Cash (paid to the utility) and Crisis (shutoffs, fuel shortage, broken furnace; $25–$1,000). The Weatherization Assistance Program uses a higher 200% FPL limit. Apply early in the Nov–March window — funds are limited. Receiving LIHEAP does not cut your SNAP." +
      ESTIMATE_NOTE,
    sourceUrl: PA_DHS_LIHEAP,
  },

  // ===========================================================================
  // 9. ACA Marketplace — premium tax credits (Pennie, PA's exchange)
  //    2026: the 400%-FPL subsidy cliff is back (uses prior-year, 2025, FPL).
  // ===========================================================================
  {
    systemKey: "aca_subsidy_cliff_single_2026",
    program: "ACA",
    state: null,
    thresholdType: "monthly_gross_income",
    limitCents: 5217_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "ACA / Pennie — 400% FPL subsidy cliff (single, 2026)",
    description:
      "For 2026 the enhanced premium tax credits expired and the 400%-of-FPL 'subsidy cliff' is back: subsidies are available only from 100% up to 400% FPL. 400% of the 2025 FPL ≈ $62,600/yr (single) ≈ $5,217/month — one dollar over and your subsidy is $0, no matter how expensive the plan. Uses MAGI and the prior year's FPL. Repayment caps were eliminated starting tax year 2026, so update Pennie within ~30 days of income changes to avoid tax-time repayment. Lower MAGI via pre-tax retirement, HSA, or self-employment deductions." +
      ESTIMATE_NOTE,
    sourceUrl: PENNIE,
  },
  {
    systemKey: "extra_help_lis_income_monthly_2026",
    program: "ExtraHelp",
    state: null,
    thresholdType: "monthly_unearned_income",
    limitCents: 2015_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "Medicare Part D Extra Help (LIS) — monthly income (single, 2026)",
    description:
      "2026 monthly income limit for a single individual: $2,015 ($24,180/year). Income from SSDI, DAC, and work all count toward this test (with the standard $20 disregard already built into the published limit). Extra Help is means-tested even though Medicare and SSDI are not. A direct SNT cash distribution can count as income, and cash retained in a personal bank account can increase countable resources." +
      ESTIMATE_NOTE,
    sourceUrl: MEDICARE_EXTRA_HELP,
  },
  {
    systemKey: "extra_help_lis_resources_2026",
    program: "ExtraHelp",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 18090_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "Medicare Part D Extra Help (LIS) — resource limit (single, 2026)",
    description:
      "2026 asset limit for a single individual: $18,090 (excludes home, car, and personal items)." +
      ESTIMATE_NOTE,
    sourceUrl: MEDICARE_EXTRA_HELP,
  },

  // ===========================================================================
  // 10. VA — Veterans Pension (needs-based). Disability compensation has NO
  //     income/asset limit, so only the needs-based pension limits are seeded.
  // ===========================================================================
  {
    systemKey: "va_pension_mapr_basic_2026",
    program: "VA",
    state: null,
    thresholdType: "monthly_unearned_income",
    limitCents: 1453_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "VA Pension — countable income ceiling, basic / no dependents (2026)",
    description:
      "Veterans Pension is needs-based (wartime service required). 2026 Maximum Annual Pension Rate (MAPR), basic / no dependents: $17,441/yr ≈ $1,453/month. Pension = MAPR − countable income, ÷12; if countable income ≥ MAPR, no pension. Higher MAPRs apply with a dependent ($22,839), Housebound ($21,313), or Aid & Attendance ($29,093 single). Unreimbursed medical expenses above 5% of MAPR reduce countable income. VA disability compensation, by contrast, has no income or asset limit." +
      ESTIMATE_NOTE,
    sourceUrl: VA_PENSION,
  },
  {
    systemKey: "va_pension_networth_2026",
    program: "VA",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 163699_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "VA Pension — net worth limit (income + assets, 2026)",
    description:
      "2026 VA Pension net worth limit (income + assets combined): $163,699 (Dec 1, 2025 – Nov 30, 2026). Your primary home (plus up to 2 acres) and one vehicle are excluded. A 3-year look-back applies to asset transfers, with penalties up to 5 years. VA disability compensation is not needs-based and has no net-worth limit." +
      ESTIMATE_NOTE,
    sourceUrl: VA_PENSION,
  },

  // ===========================================================================
  // 11. ABLE — Achieving a Better Life Experience accounts (2026 expansion)
  //     These limits apply to the ABLE account itself, not your checking/savings,
  //     so they're surfaced as reference figures (not auto-evaluated).
  // ===========================================================================
  {
    systemKey: "able_contribution_cap_2026",
    program: "ABLE",
    state: null,
    thresholdType: "custom",
    limitCents: 20000_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "ABLE — annual contribution cap (2026)",
    description:
      "2026 base annual ABLE contribution cap: $20,000 from all sources combined (up from $19,000). An employed owner without an employer retirement plan can add up to $15,650 more under ABLE to Work (capped at earned income) → total up to ~$35,650. 529-to-ABLE rollovers are permanent and count toward the annual cap. Eligibility expanded Jan 1, 2026 to a disability onset before age 46. This is a contribution limit on the ABLE account, not a balance check on your linked bank accounts.",
    sourceUrl: PA_ABLE,
  },
  {
    systemKey: "able_ssi_exclusion_2026",
    program: "ABLE",
    state: null,
    thresholdType: "custom",
    limitCents: 100000_00,
    comparison: "lte",
    warnAtPercent: 0.9,
    effectiveFrom: FROM_2026,
    effectiveTo: null,
    label: "ABLE — SSI resource exclusion cap (2026)",
    description:
      "The first $100,000 in an ABLE account is excluded from SSI's $2,000 resource limit. Over $100,000, SSI cash is suspended (not terminated) until you spend down, and Medicaid continues during suspension. For Medicaid there is no cap — the entire ABLE balance is excluded. Housing-withdrawal timing trap: spend a housing withdrawal in the same calendar month you take it, or the leftover counts as an SSI resource on the 1st. This figure tracks the ABLE account balance, not your linked bank accounts.",
    sourceUrl: PA_ABLE,
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
