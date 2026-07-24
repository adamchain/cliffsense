import { SSI_GENERAL_INCOME_EXCLUSION_CENTS } from "@/lib/thresholds/metrics";

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
        "Food and non-shelter items paid directly to a vendor are excluded from countable income (SSA removed food from ISM effective Sept 30, 2024) and do not reduce the SSI check.";
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
