/**
 * Pennsylvania SNAP income limits for October 1, 2026 through September 30, 2027.
 * 200% is the Broad-Based Categorical Eligibility gross screening guide (PA DHS).
 * 130% is the federal simplified-reporting line, not the Pennsylvania eligibility ceiling.
 * Source: PA DHS SNAP Handbook Appendix A, effective October 1, 2026; USDA FY 2027 130% table.
 * Amounts are cents.
 */

export const SNAP_GROSS_200_CENTS = [
  2660_00, 3608_00, 4554_00, 5500_00, 6448_00, 7394_00, 8340_00, 9288_00,
] as const;

export const SNAP_GROSS_200_EXTRA_CENTS = 948_00;

export const SNAP_GROSS_130_CENTS = [
  1729_00, 2345_00, 2960_00, 3575_00, 4191_00, 4806_00, 5421_00, 6037_00,
] as const;

export const SNAP_GROSS_130_EXTRA_CENTS = 616_00;

/** Elderly or disabled household that is over 200% and tested on net income. Also the substantial lottery or gambling line. */
export const SNAP_ELDERLY_RESOURCE_CENTS = 4750_00;

/** A single other-income deposit at least this large is treated as a nonrecurring lump sum, which is not SNAP income. */
export const SNAP_LUMP_SUM_CENTS = 1500_00;

function householdIndex(householdSize: number): number {
  return Math.max(1, Math.floor(householdSize) || 1);
}

export function snapGross200Cents(householdSize: number): number {
  const n = householdIndex(householdSize);
  if (n <= SNAP_GROSS_200_CENTS.length) return SNAP_GROSS_200_CENTS[n - 1]!;
  return SNAP_GROSS_200_CENTS[SNAP_GROSS_200_CENTS.length - 1]! + (n - SNAP_GROSS_200_CENTS.length) * SNAP_GROSS_200_EXTRA_CENTS;
}

export function snapGross130Cents(householdSize: number): number {
  const n = householdIndex(householdSize);
  if (n <= SNAP_GROSS_130_CENTS.length) return SNAP_GROSS_130_CENTS[n - 1]!;
  return SNAP_GROSS_130_CENTS[SNAP_GROSS_130_CENTS.length - 1]! + (n - SNAP_GROSS_130_CENTS.length) * SNAP_GROSS_130_EXTRA_CENTS;
}

export type SnapGrossDisplay = {
  status: "ok" | "watch" | "concern";
  /** Gross income is over the 130% reporting line and still under the 200% screening guide. */
  reportingDue: boolean;
};

/**
 * The in-app SNAP card uses the 200% screening guide. Income over 130% and still
 * under that guide is a reporting review, not a loss of SNAP.
 */
export function snapGrossDisplayStatus(input: {
  currentCents: number | null;
  eligibilityLimitCents: number;
  householdSize: number;
  warnAt?: number;
  attached?: boolean;
}): SnapGrossDisplay {
  if (input.attached === false || input.currentCents == null) {
    return { status: "ok", reportingDue: false };
  }
  const value = input.currentCents;
  const limit = input.eligibilityLimitCents;
  const warnAt = input.warnAt ?? 0.9;
  const overEligibility = value >= limit;
  const nearEligibility = value >= Math.floor(limit * warnAt);
  const reportingDue = value > snapGross130Cents(input.householdSize) && !overEligibility;
  if (overEligibility) return { status: "concern", reportingDue: false };
  if (reportingDue || nearEligibility) return { status: "watch", reportingDue };
  return { status: "ok", reportingDue: false };
}

/** Households of 9 or more use the 8-person seed plus $948 for each extra person. */
export function snapStoredGrossLimitCents(
  systemKey: string | undefined,
  limitCents: number,
  householdSize: number,
): number {
  const snap = /^pa_snap_gross_hh(\d+)_/.exec(systemKey ?? "");
  if (!snap) return limitCents;
  const n = Number(snap[1]);
  if (n >= 8 && householdSize > 8) return limitCents + (householdSize - 8) * SNAP_GROSS_200_EXTRA_CENTS;
  return limitCents;
}

export function passesSnapHouseholdRule(systemKey: string, householdSize: number): boolean | null {
  const snap = /^pa_snap_gross_hh(\d+)_/.exec(systemKey);
  if (!snap) return null;
  const n = Number(snap[1]);
  return n >= 8 ? householdSize >= 8 : householdSize === n;
}

const GAMBLING_HINT = /\b(lottery|lotto|gambling|casino)\b/i;

export function isSubstantialGamblingWin(deposits: { amountCents: number; name?: string }[]): boolean {
  return deposits.some(
    (d) => GAMBLING_HINT.test(d.name ?? "") && Math.abs(d.amountCents) >= SNAP_ELDERLY_RESOURCE_CENTS,
  );
}

export type SnapOtherIncome = {
  amountCents: number;
  userCategory?: string;
  pending?: boolean;
  excludedFromThresholds?: boolean;
  date: string;
};

export function oneTimeOtherIncomeCents(transactions: SnapOtherIncome[], monthPrefix: string): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.pending || t.excludedFromThresholds) continue;
    if (!t.date.startsWith(monthPrefix)) continue;
    if (t.userCategory !== "other_income" || t.amountCents >= 0) continue;
    const amt = Math.abs(t.amountCents);
    if (amt >= SNAP_LUMP_SUM_CENTS) sum += amt;
  }
  return sum;
}
