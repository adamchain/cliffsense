import type { MonthlyIncomeBreakdown } from "@/lib/thresholds/metrics";

/** 2026 QMB income. These amounts are 100% of the poverty guideline plus the $20 disregard. */
const QMB_INCOME_ONE_CENTS = 1350_00;
const QMB_INCOME_COUPLE_CENTS = 1824_00;

/** 2026 QMB resources. Exactly at the limit still qualifies. */
const QMB_RESOURCE_ONE_CENTS = 9950_00;
const QMB_RESOURCE_COUPLE_CENTS = 14910_00;

const EARNED_EXCLUSION_CENTS = 65_00;

export function qmbIncomeLimitCents(householdSize: number): number {
  return householdSize >= 2 ? QMB_INCOME_COUPLE_CENTS : QMB_INCOME_ONE_CENTS;
}

export function qmbResourceLimitCents(householdSize: number): number {
  return householdSize >= 2 ? QMB_RESOURCE_COUPLE_CENTS : QMB_RESOURCE_ONE_CENTS;
}

/**
 * Income for the QMB test before the $20 disregard.
 * The published limit already includes that $20. Earned income still gets the $65 exclusion and one-half.
 */
export function qmbIncomeBeforeGeneralExclusionCents(b: MonthlyIncomeBreakdown): number {
  const unearned = Math.max(0, b.benefitCents + b.otherCents);
  const earnedAfter65 = Math.max(0, b.earnedGrossCents - EARNED_EXCLUSION_CENTS);
  return unearned + Math.floor(earnedAfter65 / 2);
}

/** Important only when income is over the limit. Income equal to the limit still qualifies. */
export function qmbIncomeAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents > limitCents) return "breach";
  if (cents >= Math.floor(limitCents * 0.85)) return "warning";
  return null;
}

/** Important only when resources are over the limit. */
export function qmbResourceAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents > limitCents) return "breach";
  if (cents > Math.floor(limitCents * 0.85)) return "warning";
  return null;
}
