/**
 * Find other transactions that look like the same payor/merchant so the user
 * can apply a category in bulk after labeling one.
 */

export function normalizeMerchantKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w &$.'/-]+/g, "")
    .slice(0, 80);
}

export type SimilarSource = {
  _id: { toString(): string } | string;
  beneficiaryId: { toString(): string };
  bankConnectionId?: { toString(): string } | null;
  merchantName?: string | null;
  name?: string | null;
  amountCents: number;
  userCategory: string;
};

export type SimilarMatch = {
  matchField: "merchantName" | "name";
  matchValue: string;
  /** Human label for the prompt (merchant or truncated name). */
  label: string;
};

export function similarMatchFrom(tx: SimilarSource): SimilarMatch | null {
  const merchant = normalizeMerchantKey(tx.merchantName ?? "");
  if (merchant.length >= 2) {
    return {
      matchField: "merchantName",
      matchValue: merchant,
      label: (tx.merchantName ?? "").trim() || merchant,
    };
  }
  const name = normalizeMerchantKey(tx.name ?? "");
  if (name.length >= 3) {
    return {
      matchField: "name",
      matchValue: name,
      label: (tx.name ?? "").trim() || name,
    };
  }
  return null;
}

/** Broad Mongo pre-filter; precise match is applied in `rowMatchesSimilar`. */
export function similarPrefilter(tx: SimilarSource): Record<string, unknown> {
  const parts: Record<string, unknown> = {
    beneficiaryId: tx.beneficiaryId,
  };
  if (tx.bankConnectionId) {
    parts.bankConnectionId = tx.bankConnectionId;
  }
  if (tx.amountCents < 0) {
    parts.amountCents = { $lt: 0 };
  } else if (tx.amountCents > 0) {
    parts.amountCents = { $gt: 0 };
  }
  return parts;
}

export function rowMatchesSimilar(
  row: { merchantName?: string | null; name?: string | null },
  match: SimilarMatch,
): boolean {
  if (match.matchField === "merchantName") {
    return normalizeMerchantKey(row.merchantName ?? "") === match.matchValue;
  }
  // Name: allow prefix match so "ACME PAYROLL 07/25" matches "ACME PAYROLL 08/08"
  const n = normalizeMerchantKey(row.name ?? "");
  return n === match.matchValue || n.startsWith(match.matchValue) || match.matchValue.startsWith(n);
}

/** Same payor and the same amount, so one Social Security deposit is not the other. */
export type RecurringSeriesMatch = SimilarMatch & { amountCents: number };

export function recurringSeriesMatchFrom(tx: SimilarSource): RecurringSeriesMatch | null {
  if (!tx.amountCents) return null;
  const base = similarMatchFrom(tx);
  if (!base) return null;
  return { ...base, amountCents: tx.amountCents };
}

export function rowMatchesRecurringSeries(
  row: { merchantName?: string | null; name?: string | null; amountCents: number },
  match: RecurringSeriesMatch,
): boolean {
  return row.amountCents === match.amountCents && rowMatchesSimilar(row, match);
}
