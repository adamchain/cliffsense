/**
 * 2026 HHS poverty guideline for the 48 states, in dollars.
 * Healthy Horizons income is 100% of that guideline, and Pennsylvania rounds each household up to the next dollar.
 */
const FPIG_BASE_DOLLARS = 15_960;
const FPIG_EXTRA_DOLLARS = 5_680;

/** 100% FPIG for the household, in cents. The $20 SSI exclusion is already inside this figure. */
export function abdIncomeLimitCents(householdSize: number): number {
  const n = Math.max(1, Math.floor(householdSize) || 1);
  const annualDollars = FPIG_BASE_DOLLARS + (n - 1) * FPIG_EXTRA_DOLLARS;
  return Math.ceil(annualDollars / 12) * 100;
}

export const ABD_RESOURCE_ONE_CENTS = 2000_00;
export const ABD_RESOURCE_TWO_OR_MORE_CENTS = 3000_00;
export const WAIVER_RESOURCE_CENTS = 8000_00;

/**
 * Categorically needy resources: $2,000 for one person, $3,000 for two or more.
 * A waiver enrollment uses the $8,000 waiver limit.
 * Returns null when the person is under 21, because that resource test does not apply.
 */
export function abdResourceLimitCents(input: {
  householdSize: number;
  onWaiver: boolean;
  age: number | null;
}): number | null {
  if (input.age != null && input.age < 21) return null;
  if (input.onWaiver) return WAIVER_RESOURCE_CENTS;
  return input.householdSize >= 2 ? ABD_RESOURCE_TWO_OR_MORE_CENTS : ABD_RESOURCE_ONE_CENTS;
}
