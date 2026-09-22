/** 2026 MAWD countable income, 250% of the poverty guideline, households of 1–8, then $1,184 each. */
const MAWD_250_CENTS = [3325_00, 4509_00, 5692_00, 6875_00, 8059_00, 9242_00, 10425_00, 11609_00];
const MAWD_250_EXTRA_CENTS = 1184_00;

/** 2026 Workers with Job Success countable income, 600% of the poverty guideline, then $2,840 each. */
const MAWD_600_CENTS = [7980_00, 10820_00, 13660_00, 16500_00, 19340_00, 22180_00, 25020_00, 27860_00];
const MAWD_600_EXTRA_CENTS = 2840_00;

/** Countable resources of $10,000 or less, for any household size. Exactly at $10,000 still qualifies. */
export const MAWD_RESOURCE_CENTS = 10000_00;

function householdAmount(table: number[], extra: number, householdSize: number): number {
  const n = Math.max(1, Math.floor(householdSize) || 1);
  if (n <= table.length) return table[n - 1];
  return table[table.length - 1] + (n - table.length) * extra;
}

export function mawdIncomeLimitCents(householdSize: number): number {
  return householdAmount(MAWD_250_CENTS, MAWD_250_EXTRA_CENTS, householdSize);
}

export function mawdJobSuccessIncomeLimitCents(householdSize: number): number {
  return householdAmount(MAWD_600_CENTS, MAWD_600_EXTRA_CENTS, householdSize);
}

export function enrolledWorkersWithJobSuccess(
  enrollments: { program?: string | null; contextData?: unknown }[],
): boolean {
  return enrollments.some((row) => {
    if (String(row.program ?? "").toUpperCase() !== "MAWD") return false;
    const data = row.contextData;
    if (!data || typeof data !== "object") return false;
    return (data as { workersWithJobSuccess?: unknown }).workersWithJobSuccess === true;
  });
}

/** Important when countable income reaches the limit. A warning covers the approach. */
export function mawdIncomeAlert(cents: number, limitCents: number): "warning" | "breach" | null {
  if (cents >= limitCents) return "breach";
  if (cents >= Math.floor(limitCents * 0.85)) return "warning";
  return null;
}

/** Important only when resources are over $10,000. */
export function mawdResourceAlert(cents: number): "warning" | "breach" | null {
  if (cents > MAWD_RESOURCE_CENTS) return "breach";
  if (cents > Math.floor(MAWD_RESOURCE_CENTS * 0.85)) return "warning";
  return null;
}
