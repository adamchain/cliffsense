/** Plaid-style amounts in cents: negative = money in, positive = money out. */
export function formatSignedUsd(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  if (cents < 0) {
    return `+${formatted}`;
  }
  if (cents > 0) {
    return `\u2212${formatted}`;
  }
  return formatted;
}

export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(dt);
}

export function isInflowCents(cents: number): boolean {
  return cents < 0;
}

/** Absolute currency (e.g. account balances), not Plaid transaction direction. */
export function formatPlainUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
