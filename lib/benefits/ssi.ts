import {
  SSI_GENERAL_INCOME_EXCLUSION_CENTS,
  ssiCountableMonthlyIncomeCents,
  type MonthlyIncomeBreakdown,
} from "@/lib/thresholds/metrics";

/* ---------------------------------------------------------------------------
 * SSI Federal Benefit Rate (FBR) and how third-party payments — especially from
 * a Special Needs Trust (SNT) — affect the monthly SSI cash benefit.
 *
 * The FBR is the single figure to update each January when SSA applies the COLA;
 * every downstream number (the Presumed Maximum Value, break-even, etc.) is
 * derived from it. Keep this the ONE place the dollar amount lives.
 *
 * 2026 figures confirmed against SSA (2.8% COLA over 2025):
 *   FBR — individual: $994/month, couple: $1,491/month.
 *
 * How money from an SNT affects SSI depends on HOW it is paid, not just how much:
 *   - Cash to the beneficiary       → unearned income, dollar-for-dollar
 *                                      (after the $20 general income exclusion).
 *   - Shelter paid to a vendor      → In-Kind Support & Maintenance (ISM),
 *     (rent, mortgage, property tax,   counted at the Presumed Maximum Value
 *      gas, electric, water)           (PMV) — a cap, not dollar-for-dollar.
 *   - Food / non-shelter to a vendor→ excluded entirely. SSA removed food from
 *     (groceries, internet, phone,     ISM effective Sept 30, 2024, so these
 *      clothing, tuition, etc.)         payments do not reduce the SSI check.
 *
 * PMV = (1/3 × FBR) + $20. The "+ $20" is the presumed value assigned to the
 * ISM; the $20 general income exclusion then offsets it, so a full shelter
 * payment nets a reduction of ~(1/3 × FBR). For 2026: PMV ≈ $351.33, and a
 * capped shelter payment lowers the check by ~$331.33.
 *
 * Informational estimate only — real cases turn on other income, living
 * arrangement (VTR vs. PMV), deeming, and state supplement. Verify with SSA.
 * ------------------------------------------------------------------------- */

/** The benefit year these FBR figures apply to. Bump with the values below. */
export const SSI_FBR_YEAR = 2026;

/** 2026 SSI Federal Benefit Rate, individual (cents). Update each January. */
export const SSI_FBR_INDIVIDUAL_CENTS = 994_00;

/** 2026 SSI Federal Benefit Rate, eligible couple (cents). */
export const SSI_FBR_COUPLE_CENTS = 1491_00;

/** 2026 student earned-income exclusion. Applies before the $65 and one-half. */
export const SSI_STUDENT_EXCLUSION_MONTHLY_CENTS = 2410_00;
export const SSI_STUDENT_EXCLUSION_ANNUAL_CENTS = 9730_00;

/** Individual $2,000; eligible couple $3,000. Exactly at the limit is still eligible. */
export function ssiResourceLimitCents(householdSize: number): number {
  return householdSize >= 2 ? 3000_00 : 2000_00;
}

export function ssiFbrCents(householdSize: number): number {
  return householdSize >= 2 ? SSI_FBR_COUPLE_CENTS : SSI_FBR_INDIVIDUAL_CENTS;
}

const SSI_PAY_NAME = /\bssi\b|supplemental security income/i;
const SSDI_PAY_NAME = /\bssdi\b|disability insurance/i;

/**
 * Cents of benefit deposits that are the person's own SSI payment.
 * Those deposits are the benefit, not income that reduces it.
 * A deposit is excluded when its description says SSI, or when the person is
 * on SSI (and not SSDI/DAC) and the deposit is no larger than the FBR plus a
 * small state-supplement cushion. On SSI and SSDI together, an unnamed
 * deposit is excluded only when another, larger benefit deposit is also present.
 */
export function ssiBenefitCentsToExclude(input: {
  programs: string[];
  householdSize: number;
  deposits: { amountCents: number; name?: string }[];
}): number {
  const programs = input.programs.map((p) => p.toUpperCase());
  if (!programs.includes("SSI")) return 0;
  const alsoTitleIi = programs.includes("SSDI") || programs.includes("DAC");
  const ceiling = ssiFbrCents(input.householdSize) + 50_00;
  const rows = input.deposits
    .map((d) => ({ cents: Math.abs(d.amountCents), name: d.name ?? "" }))
    .filter((d) => d.cents > 0);

  let excluded = 0;
  const unnamedUnderCeiling: number[] = [];
  for (const d of rows) {
    const namedSsi = SSI_PAY_NAME.test(d.name) && !SSDI_PAY_NAME.test(d.name);
    const namedSsdi = SSDI_PAY_NAME.test(d.name) && !SSI_PAY_NAME.test(d.name);
    if (namedSsi) {
      excluded += d.cents;
      continue;
    }
    if (namedSsdi) continue;
    if (d.cents <= ceiling) unnamedUnderCeiling.push(d.cents);
  }
  if (!alsoTitleIi) {
    excluded += unnamedUnderCeiling.reduce((a, b) => a + b, 0);
  } else if (unnamedUnderCeiling.length > 0 && rows.length > unnamedUnderCeiling.length) {
    excluded += unnamedUnderCeiling.reduce((a, b) => a + b, 0);
  }
  return excluded;
}

/** SEIE for someone under 22. Age 22 and older, or an unknown age, gets none. */
export function studentEarnedIncomeExclusionCents(input: {
  age: number | null;
  earnedGrossThisMonthCents: number;
  earnedGrossYearToDateBeforeMonthCents: number;
}): number {
  if (input.age == null || input.age >= 22 || input.earnedGrossThisMonthCents <= 0) return 0;
  const remainingAnnual = Math.max(
    0,
    SSI_STUDENT_EXCLUSION_ANNUAL_CENTS - Math.max(0, input.earnedGrossYearToDateBeforeMonthCents),
  );
  return Math.min(SSI_STUDENT_EXCLUSION_MONTHLY_CENTS, remainingAnnual, input.earnedGrossThisMonthCents);
}

/** Days from today (UTC) until the birthday on which the person turns `age`. Negative if that birthday has passed. */
export function daysUntilTurningAge(dob: Date, age: number, now: Date): number {
  const target = Date.UTC(dob.getUTCFullYear() + age, dob.getUTCMonth(), dob.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86400000);
}

const SNT_CASH_HINT = /\b(snt|special\s+needs\s+trust)\b/i;

/** An inflow whose description says it came from a special needs trust. Shelter paid to a vendor does not land in this account. */
export function isSntCashDeposit(name?: string, merchantName?: string): boolean {
  return SNT_CASH_HINT.test(`${name ?? ""} ${merchantName ?? ""}`);
}

/**
 * A lump sum is income in the month it arrives. Flag a large one, and also a
 * smaller one when the balance is over the resource limit only because of it.
 */
export function lumpSumNeedsReport(input: {
  otherInflowCents: number;
  assetCents: number;
  programs: string[];
  householdSize: number;
}): boolean {
  const programs = input.programs.map((p) => p.toUpperCase());
  const onSsi = programs.includes("SSI");
  const onAbd = programs.includes("MEDICAIDABD") || programs.includes("MEDICAID");
  if (!onSsi && !onAbd) return false;
  if (input.otherInflowCents >= 1500_00) return true;
  if (input.otherInflowCents < 100_00) return false;
  const before = input.assetCents - input.otherInflowCents;
  const limits: number[] = [];
  if (onSsi) limits.push(ssiResourceLimitCents(input.householdSize));
  if (onAbd) limits.push(2000_00);
  return limits.some((limit) => input.assetCents > limit && before <= limit);
}

export function adjustedSsiCountable(input: {
  breakdown: MonthlyIncomeBreakdown;
  programs: string[];
  householdSize: number;
  benefitDeposits: { amountCents: number; name?: string }[];
  age: number | null;
  earnedGrossYearToDateBeforeMonthCents: number;
}): { countable: number; unearnedOnly: number } {
  const excludeUnearnedCents = ssiBenefitCentsToExclude({
    programs: input.programs,
    householdSize: input.householdSize,
    deposits: input.benefitDeposits,
  });
  const studentExclusionCents = studentEarnedIncomeExclusionCents({
    age: input.age,
    earnedGrossThisMonthCents: input.breakdown.earnedGrossCents,
    earnedGrossYearToDateBeforeMonthCents: input.earnedGrossYearToDateBeforeMonthCents,
  });
  const countable = ssiCountableMonthlyIncomeCents(input.breakdown, {
    excludeUnearnedCents,
    studentExclusionCents,
  });
  const unearnedOnly = ssiCountableMonthlyIncomeCents(
    { ...input.breakdown, earnedNetCents: 0, earnedGrossCents: 0 },
    { excludeUnearnedCents },
  );
  return { countable, unearnedOnly };
}

/** True from `withinDays` before the birthday through `afterDays` after it. */
export function ageMilestoneWindow(
  dob: Date | null | undefined,
  age: number,
  now: Date,
  withinDays: number,
  afterDays: number,
): boolean {
  if (!dob || Number.isNaN(dob.getTime())) return false;
  const days = daysUntilTurningAge(dob, age, now);
  return days <= withinDays && days >= -afterDays;
}

/**
 * Presumed Maximum Value: the most an ISM item can be counted at.
 * PMV = (1/3 × FBR) + $20 general income exclusion.
 */
export function presumedMaxValueCents(fbrCents: number = SSI_FBR_INDIVIDUAL_CENTS): number {
  return Math.round(fbrCents / 3) + SSI_GENERAL_INCOME_EXCLUSION_CENTS;
}

/** How a Special Needs Trust distribution is made — the key driver of SSI impact. */
export type SntPaymentType =
  /** Cash paid directly to the beneficiary. */
  | "cash"
  /** Shelter paid directly to a vendor (rent, mortgage, property tax, utilities). */
  | "shelter"
  /** Food or other non-shelter items paid directly to a vendor. */
  | "food_nonshelter";

export type SsiSntEstimateInput = {
  paymentType: SntPaymentType;
  /** Amount of the trust distribution (cents). */
  amountCents: number;
  /** Other countable unearned income the beneficiary already has this month (cents). */
  otherUnearnedCents?: number;
  /** FBR to use — defaults to the individual rate. Pass the couple rate for couples. */
  fbrCents?: number;
};

export type SsiSntEstimate = {
  paymentType: SntPaymentType;
  fbrCents: number;
  presumedMaxValueCents: number;
  /** Value this payment is counted at as unearned income, before the $20 general exclusion. */
  countedValueCents: number;
  /** Total countable income after the $20 general income exclusion (cents). */
  countableCents: number;
  /** Estimated SSI cash benefit for the month (cents). */
  ssiCents: number;
  /** How much this payment lowered the SSI check vs. the same month without it (cents). */
  reductionCents: number;
  /** Plain-language explanation of the rule applied. */
  note: string;
};

/**
 * Estimate the SSI cash benefit for a month given a single SNT distribution.
 * SSI = FBR − countable income, where countable income = (value counted for this
 * payment + other unearned income) − the $20 general income exclusion.
 */
export function estimateSsiWithSntPayment(input: SsiSntEstimateInput): SsiSntEstimate {
  const fbrCents = input.fbrCents ?? SSI_FBR_INDIVIDUAL_CENTS;
  const otherUnearned = Math.max(0, input.otherUnearnedCents ?? 0);
  const amount = Math.max(0, input.amountCents);
  const pmv = presumedMaxValueCents(fbrCents);

  let countedValueCents: number;
  let note: string;
  switch (input.paymentType) {
    case "cash":
      countedValueCents = amount;
      note =
        "Cash paid directly to the beneficiary is unearned income — it reduces SSI dollar-for-dollar after the $20 general income exclusion. An SNT should avoid distributing cash.";
      break;
    case "shelter":
      countedValueCents = Math.min(amount, pmv);
      note =
        "Shelter paid directly to a vendor (rent, mortgage, property tax, gas, electric, water) is In-Kind Support & Maintenance, counted at no more than the Presumed Maximum Value — so the reduction is capped, not dollar-for-dollar.";
      break;
    case "food_nonshelter":
      countedValueCents = 0;
      note =
        "Food and non-shelter items paid directly to a vendor (groceries, internet, phone, cable, tuition, clothing) are excluded from countable income — SSA removed food from ISM effective Sept 30, 2024 (89 FR 21246) — and do not reduce the SSI check.";
      break;
  }

  const countableCents = Math.max(
    0,
    countedValueCents + otherUnearned - SSI_GENERAL_INCOME_EXCLUSION_CENTS,
  );
  const ssiCents = Math.max(0, fbrCents - countableCents);

  // Same month without the trust distribution, for the marginal impact.
  const baselineCountable = Math.max(0, otherUnearned - SSI_GENERAL_INCOME_EXCLUSION_CENTS);
  const baselineSsi = Math.max(0, fbrCents - baselineCountable);

  return {
    paymentType: input.paymentType,
    fbrCents,
    presumedMaxValueCents: pmv,
    countedValueCents,
    countableCents,
    ssiCents,
    reductionCents: baselineSsi - ssiCents,
    note,
  };
}
