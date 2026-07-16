/**
 * Turns raw CSV cells from a bank export into normalized transaction rows in
 * the app's convention (amountCents, negative = money in). Bank exports vary
 * wildly, so we auto-detect columns from header names and let the API override
 * the guess with an explicit mapping.
 */

import { suggestUserCategoryFromPlaid } from "@/lib/transactions/suggest-user-category";

export type AmountMode =
  // A single signed amount column. `depositsArePositive` says whether a
  // positive number in that column means money IN (typical) or OUT.
  | { kind: "single"; amountColumn: number; depositsArePositive: boolean }
  // Separate debit (out) and credit (in) columns.
  | { kind: "split"; debitColumn: number; creditColumn: number };

export type ColumnMapping = {
  dateColumn: number;
  postedDateColumn?: number;
  descriptionColumn?: number;
  merchantColumn?: number;
  categoryColumn?: number;
  amount: AmountMode;
};

export type NormalizedRow = {
  date: string; // YYYY-MM-DD
  postedDate: string;
  amountCents: number; // negative = money in
  name: string;
  merchantName: string;
  category: string;
  suggestedUserCategory: string;
  rawLine: string;
};

export type NormalizeResult = {
  valid: NormalizedRow[];
  /** Rows we couldn't parse (bad date or amount), with a reason. */
  invalid: { rawLine: string; reason: string }[];
};

const HEADER_ALIASES: Record<keyof Omit<ColumnMapping, "amount">, string[]> = {
  dateColumn: ["date", "transaction date", "trans date", "posting date", "posted date", "date posted"],
  postedDateColumn: ["posted date", "settlement date", "clearing date", "post date"],
  descriptionColumn: ["description", "memo", "details", "narration", "transaction", "name", "payee"],
  merchantColumn: ["merchant", "merchant name", "payee", "name"],
  categoryColumn: ["category", "type", "transaction type"],
};

const AMOUNT_ALIASES = ["amount", "transaction amount", "amount (usd)", "value"];
const DEBIT_ALIASES = ["debit", "withdrawal", "withdrawals", "money out", "paid out", "outflow"];
const CREDIT_ALIASES = ["credit", "deposit", "deposits", "money in", "paid in", "inflow"];

function findColumn(headers: string[], aliases: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  // Exact match first, then substring, to avoid "date" matching "update".
  for (const alias of aliases) {
    const i = norm.indexOf(alias);
    if (i !== -1) return i;
  }
  for (const alias of aliases) {
    const i = norm.findIndex((h) => h.includes(alias));
    if (i !== -1) return i;
  }
  return -1;
}

/** Best-effort auto-detection of the column mapping from header names. */
export function detectMapping(headers: string[]): ColumnMapping | null {
  const dateColumn = findColumn(headers, HEADER_ALIASES.dateColumn);
  if (dateColumn === -1) return null;

  const descriptionColumn = findColumn(headers, HEADER_ALIASES.descriptionColumn);
  const merchantColumn = findColumn(headers, HEADER_ALIASES.merchantColumn);
  const categoryColumn = findColumn(headers, HEADER_ALIASES.categoryColumn);
  const postedRaw = findColumn(headers, HEADER_ALIASES.postedDateColumn);
  const postedDateColumn = postedRaw !== -1 && postedRaw !== dateColumn ? postedRaw : undefined;

  const debitColumn = findColumn(headers, DEBIT_ALIASES);
  const creditColumn = findColumn(headers, CREDIT_ALIASES);
  const amountColumn = findColumn(headers, AMOUNT_ALIASES);

  let amount: AmountMode;
  if (debitColumn !== -1 && creditColumn !== -1 && debitColumn !== creditColumn) {
    amount = { kind: "split", debitColumn, creditColumn };
  } else if (amountColumn !== -1) {
    // Most banks export deposits as positive numbers in a single column.
    amount = { kind: "single", amountColumn, depositsArePositive: true };
  } else {
    return null;
  }

  return {
    dateColumn,
    postedDateColumn,
    descriptionColumn: descriptionColumn !== -1 ? descriptionColumn : undefined,
    merchantColumn: merchantColumn !== -1 ? merchantColumn : undefined,
    categoryColumn: categoryColumn !== -1 ? categoryColumn : undefined,
    amount,
  };
}

/** Parse many common bank date formats into YYYY-MM-DD, or "" if unparseable. */
export function parseDateToIso(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  // Already ISO (optionally with a time component).
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  // MM/DD/YYYY or M/D/YY (US), and DD/MM handled below via range heuristic.
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slash) {
    const [, a, b, y] = slash;
    let year = Number(y);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    let month = Number(a);
    let day = Number(b);
    // If the first field can't be a month but the second can, it's DD/MM.
    if (month > 12 && day <= 12) {
      [month, day] = [day, month];
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  // Fallback: "Jan 5, 2025" style.
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

/** Parse a currency string ("$1,234.56", "(45.00)", "-45") into cents. */
export function parseAmountToCents(raw: string): number | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  let negative = false;
  // Accounting-style parentheses mean negative.
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.includes("-")) negative = true;
  // Strip currency symbols, thousands separators, whitespace, sign, "USD".
  s = s.replace(/[^0-9.]/g, "");
  if (s === "" || s === ".") return null;
  const value = Number(s);
  if (Number.isNaN(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

function cell(row: string[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) return "";
  return (row[index] ?? "").trim();
}

/**
 * Convert a bank amount (in the file's own sign convention) into the app's
 * convention where **negative = money in, positive = money out**.
 */
function toAppAmountCents(row: string[], amount: AmountMode): number | null {
  if (amount.kind === "split") {
    const debit = parseAmountToCents(cell(row, amount.debitColumn));
    const credit = parseAmountToCents(cell(row, amount.creditColumn));
    const debitAbs = debit != null ? Math.abs(debit) : 0;
    const creditAbs = credit != null ? Math.abs(credit) : 0;
    if (debitAbs === 0 && creditAbs === 0) return null;
    // Credit = money in = negative; debit = money out = positive.
    return debitAbs - creditAbs;
  }
  const parsed = parseAmountToCents(cell(row, amount.amountColumn));
  if (parsed == null) return null;
  // In the bank file: if deposits are positive, a positive number is money in,
  // which the app represents as negative. So flip when depositsArePositive.
  return amount.depositsArePositive ? -parsed : parsed;
}

export function normalizeRows(
  rows: string[][],
  rawLines: string[],
  mapping: ColumnMapping,
): NormalizeResult {
  const valid: NormalizedRow[] = [];
  const invalid: { rawLine: string; reason: string }[] = [];

  rows.forEach((row, i) => {
    const rawLine = rawLines[i] ?? row.join(",");
    const date = parseDateToIso(cell(row, mapping.dateColumn));
    if (!date) {
      invalid.push({ rawLine, reason: "Unrecognized or missing date" });
      return;
    }
    const amountCents = toAppAmountCents(row, mapping.amount);
    if (amountCents == null) {
      invalid.push({ rawLine, reason: "Unrecognized or missing amount" });
      return;
    }
    const name = cell(row, mapping.descriptionColumn);
    const merchantName = cell(row, mapping.merchantColumn);
    const category = cell(row, mapping.categoryColumn);
    const postedDate = parseDateToIso(cell(row, mapping.postedDateColumn)) || date;

    // Reuse the Plaid category heuristic where we can; imported files rarely
    // carry Plaid taxonomy, so this mostly leaves rows "unclear" for review.
    const suggestedUserCategory =
      suggestUserCategoryFromPlaid({ amountCents, pfcPrimary: "", pfcDetailed: "" }) ?? "unclear";

    valid.push({
      date,
      postedDate,
      amountCents,
      name: name || merchantName || category || "Imported transaction",
      merchantName,
      category,
      suggestedUserCategory,
      rawLine,
    });
  });

  return { valid, invalid };
}
