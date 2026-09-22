import type { MonthlyIncomeBreakdown } from "@/lib/thresholds/metrics";

/** 2026 full Extra Help. Income must be below these amounts. They already include the $20 disregard. */
const EXTRA_HELP_INCOME_ONE_CENTS = 2015_00;
const EXTRA_HELP_INCOME_COUPLE_CENTS = 2725_00;

/** Resources must be below these amounts. The figures include the burial allowance. */
const EXTRA_HELP_RESOURCE_ONE_CENTS = 18090_00;
const EXTRA_HELP_RESOURCE_COUPLE_CENTS = 36100_00;

const EARNED_EXCLUSION_CENTS = 65_00;

export function extraHelpIncomeLimitCents(householdSize: number): number {
  return householdSize >= 2 ? EXTRA_HELP_INCOME_COUPLE_CENTS : EXTRA_HELP_INCOME_ONE_CENTS;
}

export function extraHelpResourceLimitCents(householdSize: number): number {
  return householdSize >= 2 ? EXTRA_HELP_RESOURCE_COUPLE_CENTS : EXTRA_HELP_RESOURCE_ONE_CENTS;
}

/** Income before the $20 disregard. The published limit already includes that $20. */
export function extraHelpIncomeBeforeGeneralExclusionCents(b: MonthlyIncomeBreakdown): number {
  const unearned = Math.max(0, b.benefitCents + b.otherCents);
  const earnedAfter65 = Math.max(0, b.earnedGrossCents - EARNED_EXCLUSION_CENTS);
  return unearned + Math.floor(earnedAfter65 / 2);
}

/** Medicaid, a Medicare Savings Program, or SSI makes Extra Help automatic. */
export function extraHelpIsAutomatic(programs: string[]): boolean {
  const keys = programs.map((p) => p.toUpperCase());
  return keys.some(
    (p) =>
      p === "SSI" ||
      p === "QMB" ||
      p === "MEDICAID" ||
      p === "MEDICAIDABD" ||
      p === "MEDICAIDMAGI" ||
      p === "MEDICAIDWAIVER" ||
      p === "MAWD",
  );
}

/** Important when income reaches the limit. The person must be below it. */
export function extraHelpIncomeAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents >= limitCents) return "breach";
  if (cents >= Math.floor(limitCents * 0.85)) return "warning";
  return null;
}

/** Important when resources reach the limit. The person must be below it. */
export function extraHelpResourceAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents >= limitCents) return "breach";
  if (cents >= Math.floor(limitCents * 0.85)) return "warning";
  return null;
}
