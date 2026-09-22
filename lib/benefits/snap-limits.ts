/**
 * Pennsylvania SNAP income limits for October 1, 2025 through October 2026.
 * 200% is the Broad-Based Categorical Eligibility gross ceiling (PA DHS).
 * 130% is the federal simplified-reporting line (USDA FY2026, 48 states).
 * Amounts are cents.
 */

export const SNAP_GROSS_200_CENTS = [
  2610_00, 3526_00, 4442_00, 5360_00, 6276_00, 7192_00, 8110_00, 9026_00,
] as const;

export const SNAP_GROSS_200_EXTRA_CENTS = 918_00;

export const SNAP_GROSS_130_CENTS = [
  1696_00, 2292_00, 2888_00, 3483_00, 4079_00, 4675_00, 5271_00, 5867_00,
] as const;

export const SNAP_GROSS_130_EXTRA_CENTS = 596_00;

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

/** Households of 9 or more use the 8-person seed plus $918 for each extra person. */
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
