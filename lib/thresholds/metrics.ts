/** YYYY-MM prefix for UTC calendar month of `now`. */
export function utcMonthPrefix(now: Date): { prefix: string; y: number; m: number } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, "0")}`;
  return { prefix, y, m };
}

/** Last instant of UTC calendar month (month is 1–12). */
export function endOfUtcMonth(y: number, month1to12: number): Date {
  return new Date(Date.UTC(y, month1to12, 0, 23, 59, 59, 999));
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function parseISODate(s: string): Date | null {
  if (!s || typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, day));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== day) return null;
  return dt;
}

export function addDaysUtc(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export function addApproxMonthUtc(d: Date): Date {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + 1);
  return x;
}

export type TxLike = {
  date: string;
  amountCents: number;
  userCategory: string;
  pending: boolean;
  /** When true, row is omitted from earned-income threshold math. */
  excludedFromThresholds?: boolean;
};

/** Sum earned-income inflows (Plaid: negative cents) for the UTC month prefix. */
export function sumEarnedInflowTransactionsCents(transactions: TxLike[], monthPrefix: string): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.pending) continue;
    if (t.excludedFromThresholds) continue;
    if (!t.date.startsWith(monthPrefix)) continue;
    if (t.userCategory !== "earned_income") continue;
    if (t.amountCents >= 0) continue;
    sum += Math.abs(t.amountCents);
  }
  return sum;
}

export type RecurringLike = {
  type: string;
  userCategory: string;
  isConfirmed: boolean;
  frequency: string;
  averageAmountCents: number;
  predictedNextDate: string;
  excludedFromThresholds?: boolean;
};

function stepNextOccurrence(from: Date, frequency: string): Date {
  switch (frequency) {
    case "weekly":
      return addDaysUtc(from, 7);
    case "biweekly":
      return addDaysUtc(from, 14);
    case "semimonthly":
      return addDaysUtc(from, 15);
    case "monthly":
    default:
      return addApproxMonthUtc(from);
  }
}

/** Advance a stream's anchor until it is on or after `min` (UTC day). */
export function alignPredictionToMin(
  predictedNextDate: string,
  frequency: string,
  min: Date,
  maxSteps = 24,
): Date | null {
  let cur = parseISODate(predictedNextDate);
  if (!cur) return null;
  let steps = 0;
  while (cur < min && steps < maxSteps) {
    cur = stepNextOccurrence(cur, frequency);
    steps += 1;
  }
  return cur;
}

/**
 * Estimated additional earned inflow (cents) from confirmed recurring payroll streams
 * with at least one occurrence strictly after `todayStart` through month end (inclusive).
 */
export function projectRecurringEarnedRestOfMonthCents(
  streams: RecurringLike[],
  now: Date,
  monthEnd: Date,
): number {
  const todayStart = startOfUtcDay(now);
  let extra = 0;
  for (const s of streams) {
    if (s.type !== "inflow") continue;
    if (!s.isConfirmed) continue;
    if (s.excludedFromThresholds) continue;
    if (s.userCategory !== "earned_income") continue;
    const anchor = alignPredictionToMin(s.predictedNextDate, s.frequency, todayStart);
    if (!anchor || anchor > monthEnd) continue;
    let cur = anchor;
    if (cur <= todayStart) {
      cur = stepNextOccurrence(cur, s.frequency);
    }
    const per = Math.abs(s.averageAmountCents);
    let guard = 0;
    while (cur <= monthEnd && guard < 16) {
      if (cur > todayStart) {
        extra += per;
      }
      cur = stepNextOccurrence(cur, s.frequency);
      guard += 1;
    }
  }
  return extra;
}

export function maxCheckingSavingsBalanceCents(
  accounts: { type: string; subtype?: string; currentBalanceCents: number }[],
): number {
  let max = 0;
  for (const a of accounts) {
    const t = (a.type ?? "").toLowerCase();
    const st = (a.subtype ?? "").toLowerCase();
    if (t === "credit") continue;
    if (st.includes("credit")) continue;
    const v = a.currentBalanceCents ?? 0;
    if (v > max) max = v;
  }
  return max;
}
