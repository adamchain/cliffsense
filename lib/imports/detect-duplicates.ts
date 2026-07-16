/**
 * Duplicate detection for imported transactions.
 *
 * A row is flagged as a duplicate when another transaction shares the same
 * **date and amount** — the signal the user asked for. We additionally guard
 * against over-merging by requiring the descriptions to be compatible (one is
 * empty, they're equal, or one contains the other after normalization). Two
 * checks run:
 *   1. Against existing DB transactions for the beneficiary (any source).
 *   2. Within the file itself (a bank export listing the same charge twice).
 */

import mongoose from "mongoose";
import Transaction from "@/lib/db/models/Transaction";
import type { NormalizedRow } from "@/lib/imports/normalize";

export type DupStatus = "new" | "duplicate_in_file" | "duplicate_existing";

export type ClassifiedRow = NormalizedRow & {
  dupStatus: DupStatus;
  dupTransactionId: string | null;
};

/** Normalize a description for fuzzy comparison (lowercase, alnum only). */
function normName(s: string): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Are two descriptions "the same enough" to treat rows as duplicates? */
function namesCompatible(a: string, b: string): boolean {
  const na = normName(a);
  const nb = normName(b);
  if (!na || !nb) return true; // missing description on either side → don't block
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/** Key used to bucket candidates by the exact-match signal (date + amount). */
function dupKey(date: string, amountCents: number): string {
  return `${date}|${amountCents}`;
}

export type ExistingTx = {
  _id: string;
  date: string;
  amountCents: number;
  name?: string;
  merchantName?: string;
};

/**
 * Pure classification: given the existing transactions that fall in the file's
 * date range, mark each incoming row as new / duplicate-in-file /
 * duplicate-of-existing. Extracted from the DB query so it can be unit-tested.
 */
export function classifyAgainst(existing: ExistingTx[], rows: NormalizedRow[]): ClassifiedRow[] {
  // Bucket existing transactions by (date, amount) for O(1) lookup.
  const existingByKey = new Map<string, ExistingTx[]>();
  for (const tx of existing) {
    const key = dupKey(tx.date, tx.amountCents);
    const list = existingByKey.get(key);
    if (list) list.push(tx);
    else existingByKey.set(key, [tx]);
  }

  // Track (date, amount) keys already claimed by an earlier row in this file so
  // a repeated charge in the export is flagged as duplicate_in_file.
  const seenInFile = new Set<string>();

  return rows.map((row) => {
    const key = dupKey(row.date, row.amountCents);

    const existingMatches = existingByKey.get(key) ?? [];
    const dbMatch = existingMatches.find((tx) =>
      namesCompatible(row.name || row.merchantName, tx.name || tx.merchantName || ""),
    );
    if (dbMatch) {
      return { ...row, dupStatus: "duplicate_existing", dupTransactionId: dbMatch._id };
    }

    if (seenInFile.has(key)) {
      return { ...row, dupStatus: "duplicate_in_file", dupTransactionId: null };
    }
    seenInFile.add(key);
    return { ...row, dupStatus: "new", dupTransactionId: null };
  });
}

export async function classifyRows(
  beneficiaryId: mongoose.Types.ObjectId,
  rows: NormalizedRow[],
): Promise<ClassifiedRow[]> {
  if (rows.length === 0) return [];

  // Bound the DB scan to the date range present in the file.
  const dates = rows.map((r) => r.date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  const existingRaw = await Transaction.find({
    beneficiaryId,
    date: { $gte: minDate, $lte: maxDate },
  })
    .select("date amountCents name merchantName")
    .lean();

  const existing: ExistingTx[] = existingRaw.map((tx) => ({
    _id: tx._id.toString(),
    date: tx.date,
    amountCents: tx.amountCents,
    name: tx.name,
    merchantName: tx.merchantName,
  }));

  return classifyAgainst(existing, rows);
}
