import { dacBenefitCentsToExclude } from "@/lib/benefits/ssi";
import { grossMonthlyIncomeCents, type MonthlyIncomeBreakdown } from "@/lib/thresholds/metrics";

/** 2026 HCBS special income limit: 300% of the $994 SSI federal benefit rate. Income equal to this still qualifies. */
export const WAIVER_GROSS_INCOME_CENTS = 2982_00;

/** One-person waiver resource limit: the $2,000 limit plus the $6,000 disregard. Exactly at this still qualifies. */
export const WAIVER_RESOURCE_CENTS = 8000_00;

/**
 * Gross countable income for the waiver special income limit.
 * Wages and SSDI stay in. A DAC benefit is left out. The $20, $65, and one-half SSI disregards are not applied.
 */
export function waiverGrossCountableCents(input: {
  breakdown: MonthlyIncomeBreakdown;
  programs: string[];
  deposits: { amountCents: number; name?: string }[];
}): number {
  const dac = dacBenefitCentsToExclude({ programs: input.programs, deposits: input.deposits });
  return Math.max(0, grossMonthlyIncomeCents(input.breakdown) - dac);
}

/** Important only when income is over the limit. A warning covers the approach, including income sitting exactly on the limit. */
export function waiverIncomeAlert(cents: number): "warning" | "breach" | null {
  if (cents > WAIVER_GROSS_INCOME_CENTS) return "breach";
  if (cents >= Math.floor(WAIVER_GROSS_INCOME_CENTS * 0.85)) return "warning";
  return null;
}

/** Important only when resources are over $8,000. */
export function waiverResourceAlert(cents: number): "warning" | "breach" | null {
  if (cents > WAIVER_RESOURCE_CENTS) return "breach";
  if (cents > Math.floor(WAIVER_RESOURCE_CENTS * 0.85)) return "warning";
  return null;
}
