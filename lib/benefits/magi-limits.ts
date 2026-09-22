/**
 * 2026 HealthChoices adult income limits, 138% of the poverty guideline.
 * Households of 1–4 use the published monthly amounts. Larger households use the
 * published annual amount divided into a month.
 */
const MAGI_ADULT_MONTHLY_DOLLARS = [1836, 2489, 3142, 3795];
const MAGI_ADULT_ANNUAL_DOLLARS = [22025, 29864, 37702, 45540, 53379, 61217, 69056, 76894];
const MAGI_ADULT_ANNUAL_EXTRA_DOLLARS = 7839;

/** Monthly income limit for an adult age 19–64. Income equal to the limit still qualifies. */
export function magiAdultIncomeLimitCents(householdSize: number): number {
  const n = Math.max(1, Math.floor(householdSize) || 1);
  if (n <= MAGI_ADULT_MONTHLY_DOLLARS.length) return MAGI_ADULT_MONTHLY_DOLLARS[n - 1] * 100;
  const annual =
    n <= MAGI_ADULT_ANNUAL_DOLLARS.length
      ? MAGI_ADULT_ANNUAL_DOLLARS[n - 1]
      : MAGI_ADULT_ANNUAL_DOLLARS[MAGI_ADULT_ANNUAL_DOLLARS.length - 1] +
        (n - MAGI_ADULT_ANNUAL_DOLLARS.length) * MAGI_ADULT_ANNUAL_EXTRA_DOLLARS;
  return Math.ceil(annual / 12) * 100;
}

/** Important only when income is over the adult limit. A warning covers the approach, including income sitting on the limit. */
export function magiAdultIncomeAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents > limitCents) return "breach";
  if (cents >= Math.floor(limitCents * 0.85)) return "warning";
  return null;
}

/** The HealthChoices adult line is for ages 19 through 64. An unknown age still uses that line. */
export function magiAdultAgeApplies(age: number | null): boolean {
  if (age == null) return true;
  return age >= 19 && age < 65;
}
