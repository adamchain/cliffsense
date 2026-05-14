import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";

export type MonthlyPoint = {
  month: string; // YYYY-MM
  cents: number;
  /** true for the in-progress current month (which is partial actual + projection). */
  partial?: boolean;
  /** true when this month is entirely projected (in the future). */
  projected?: boolean;
  /** ±1σ band, in cents. Only set on projected/partial points. */
  bandLowCents?: number;
  bandHighCents?: number;
};

export type DailyPoint = {
  day: string; // YYYY-MM-DD
  cents: number;
  projected?: boolean;
  bandLowCents?: number;
  bandHighCents?: number;
};

export type EarnedIncomeHistory = {
  /** Trailing months (oldest first), including the current partial month. */
  monthly: MonthlyPoint[];
  /** Forward-projected months (next 3, based on trailing average). */
  monthlyProjection: MonthlyPoint[];
  /** Daily series for the current month (actual through today). */
  daily: DailyPoint[];
  /** Daily projection for the rest of the current month. */
  dailyProjection: DailyPoint[];
  /** YYYY-MM-01 of the first month with data. */
  firstMonth: string | null;
  /** ISO date string for the next monthly threshold reset (1st of next month, UTC). */
  nextMonthlyReset: string;
  /** ISO date string for the next annual threshold reset (Jan 1 of next year, UTC). */
  nextAnnualReset: string;
  /** UTC today, ISO date. */
  today: string;
};

function fmtMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function fmtDay(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/** Load up to `monthsBack` months of earned-income inflow + project next 3 months. */
export async function loadEarnedIncomeHistory(
  beneficiaryId: Types.ObjectId,
  monthsBack = 24,
): Promise<EarnedIncomeHistory> {
  await connectDB();

  const now = new Date();
  const today = fmtDay(now);
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const oldestStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1),
  );
  const oldestDate = fmtDay(oldestStart);

  const txs = await Transaction.find({
    beneficiaryId,
    pending: false,
    userCategory: "earned_income",
    excludedFromThresholds: { $ne: true },
    amountCents: { $lt: 0 },
    date: { $gte: oldestDate },
  })
    .select({ date: 1, amountCents: 1 })
    .lean();

  // Bucket by day and month.
  const dayBucket = new Map<string, number>();
  const monthBucket = new Map<string, number>();
  let earliestDay: string | null = null;
  for (const t of txs) {
    const d = String(t.date).slice(0, 10);
    const m = d.slice(0, 7);
    const amt = Math.abs(Number(t.amountCents) || 0);
    dayBucket.set(d, (dayBucket.get(d) ?? 0) + amt);
    monthBucket.set(m, (monthBucket.get(m) ?? 0) + amt);
    if (!earliestDay || d < earliestDay) earliestDay = d;
  }

  // Build trailing monthly series (oldest → current).
  const monthly: MonthlyPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const md = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = fmtMonth(md);
    if (earliestDay && key < earliestDay.slice(0, 7)) continue;
    monthly.push({ month: key, cents: monthBucket.get(key) ?? 0 });
  }

  // Mark the current month as partial and replace its value with actual-MTD + projection.
  const currentMonthKey = fmtMonth(currentMonthStart);
  const completeMonthlyTotals: number[] = [];
  for (const p of monthly) {
    if (p.month !== currentMonthKey) {
      completeMonthlyTotals.push(p.cents);
    }
  }
  const trailingForProjection = completeMonthlyTotals.slice(-6); // last 6 complete months
  const avgMonthly = mean(trailingForProjection);
  const sdMonthly = stdev(trailingForProjection);

  // Current month partial: actual MTD + projected rest of month using daily run-rate.
  const dayOfMonth = now.getUTCDate();
  const dim = daysInMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
  let mtdCents = 0;
  for (let d = 1; d <= dayOfMonth; d++) {
    const k = `${currentMonthKey}-${String(d).padStart(2, "0")}`;
    mtdCents += dayBucket.get(k) ?? 0;
  }
  const dailyRunRate = dayOfMonth > 0 ? mtdCents / dayOfMonth : 0;
  const remainingDays = Math.max(0, dim - dayOfMonth);
  const projectedCurrentMonth = Math.round(mtdCents + dailyRunRate * remainingDays);

  // Use the larger of (run-rate σ) and (historical monthly σ) for the current-month band.
  // σ from current-month run-rate: assume daily variance proportional to σ of nonzero daily inflows.
  const nonzeroDailyCents: number[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const md = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = fmtMonth(md);
    const dim2 = daysInMonth(md.getUTCFullYear(), md.getUTCMonth() + 1);
    for (let d = 1; d <= dim2; d++) {
      const k = `${key}-${String(d).padStart(2, "0")}`;
      if (k > today) continue;
      const v = dayBucket.get(k) ?? 0;
      if (v > 0) nonzeroDailyCents.push(v);
    }
  }
  const sdDaily = stdev(nonzeroDailyCents);
  const remainingDaysSigma = sdDaily * Math.sqrt(Math.max(1, remainingDays));
  const currentBand = Math.max(sdMonthly, remainingDaysSigma, projectedCurrentMonth * 0.05);

  for (const p of monthly) {
    if (p.month === currentMonthKey) {
      p.partial = true;
      p.cents = projectedCurrentMonth;
      p.bandLowCents = Math.max(0, Math.round(projectedCurrentMonth - currentBand));
      p.bandHighCents = Math.round(projectedCurrentMonth + currentBand);
    }
  }

  // Forward monthly projection: next 3 months. Each month gets avg ± σ (floored at 5%).
  const monthlyProjection: MonthlyPoint[] = [];
  for (let i = 1; i <= 3; i++) {
    const md = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const key = fmtMonth(md);
    const band = Math.max(sdMonthly, avgMonthly * 0.05);
    monthlyProjection.push({
      month: key,
      cents: Math.round(avgMonthly),
      projected: true,
      bandLowCents: Math.max(0, Math.round(avgMonthly - band)),
      bandHighCents: Math.round(avgMonthly + band),
    });
  }

  // Daily series for current month.
  const daily: DailyPoint[] = [];
  for (let d = 1; d <= dayOfMonth; d++) {
    const k = `${currentMonthKey}-${String(d).padStart(2, "0")}`;
    daily.push({ day: k, cents: dayBucket.get(k) ?? 0 });
  }
  // Daily projection for remaining days.
  const dailyProjection: DailyPoint[] = [];
  const dailyBand = Math.max(sdDaily, dailyRunRate * 0.1);
  for (let d = dayOfMonth + 1; d <= dim; d++) {
    const k = `${currentMonthKey}-${String(d).padStart(2, "0")}`;
    dailyProjection.push({
      day: k,
      cents: Math.round(dailyRunRate),
      projected: true,
      bandLowCents: Math.max(0, Math.round(dailyRunRate - dailyBand)),
      bandHighCents: Math.round(dailyRunRate + dailyBand),
    });
  }

  const nextMonthlyReset = fmtDay(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  );
  const nextAnnualReset = fmtDay(new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)));

  return {
    monthly,
    monthlyProjection,
    daily,
    dailyProjection,
    firstMonth: earliestDay ? earliestDay.slice(0, 7) : null,
    nextMonthlyReset,
    nextAnnualReset,
    today,
  };
}
