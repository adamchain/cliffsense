"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EarnedIncomeHistory } from "@/lib/thresholds/earned-income-history";

type Range = "1M" | "3M" | "6M" | "1Y" | "ALL";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "All" },
];

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function shortMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

type ChartRow = {
  key: string;
  label: string;
  actual: number | null;
  projected: number | null;
  bandLow: number | null;
  bandHigh: number | null;
  /** Only set on daily-mode rows so we can render reset markers by day. */
  day?: string;
};

function buildMonthlyRows(
  history: EarnedIncomeHistory,
  monthsToShow: number | "ALL",
): ChartRow[] {
  const past = history.monthly.slice(
    monthsToShow === "ALL" ? 0 : Math.max(0, history.monthly.length - monthsToShow),
  );
  const projected = history.monthlyProjection;
  const rows: ChartRow[] = [];
  for (const p of past) {
    rows.push({
      key: p.month,
      label: shortMonthLabel(p.month),
      actual: p.partial ? null : p.cents,
      projected: p.partial ? p.cents : null,
      bandLow: p.partial ? p.bandLowCents ?? null : null,
      bandHigh: p.partial ? p.bandHighCents ?? null : null,
    });
  }
  for (const p of projected) {
    rows.push({
      key: p.month,
      label: shortMonthLabel(p.month),
      actual: null,
      projected: p.cents,
      bandLow: p.bandLowCents ?? null,
      bandHigh: p.bandHighCents ?? null,
    });
  }
  return rows;
}

function buildDailyRows(history: EarnedIncomeHistory): ChartRow[] {
  // Daily view shows cumulative MTD + projected cumulative for rest of month.
  const rows: ChartRow[] = [];
  let cum = 0;
  for (const p of history.daily) {
    cum += p.cents;
    rows.push({
      key: p.day,
      label: p.day.slice(5),
      actual: cum,
      projected: null,
      bandLow: null,
      bandHigh: null,
      day: p.day,
    });
  }
  // Bridge: today acts as the anchor for the projection — include it in projected series too.
  if (rows.length > 0) {
    const anchor = rows[rows.length - 1];
    rows[rows.length - 1] = { ...anchor, projected: anchor.actual };
  }
  let projCum = cum;
  for (const p of history.dailyProjection) {
    projCum += p.cents;
    const bandStep = (p.bandHighCents ?? p.cents) - (p.bandLowCents ?? p.cents);
    rows.push({
      key: p.day,
      label: p.day.slice(5),
      actual: null,
      projected: projCum,
      bandLow: Math.max(0, projCum - bandStep / 2),
      bandHigh: projCum + bandStep / 2,
      day: p.day,
    });
  }
  return rows;
}

type ResetMarker = { key: string; label: string };

function findResetMarkers(
  rows: ChartRow[],
  history: EarnedIncomeHistory,
  mode: "daily" | "monthly",
): ResetMarker[] {
  const out: ResetMarker[] = [];
  if (mode === "daily") {
    // Monthly reset = 1st of next month. The daily view ends on the last day of current month,
    // so the reset effectively lands at the right edge — mark the last point.
    if (rows.length > 0) {
      out.push({ key: rows[rows.length - 1].key, label: "Reset" });
    }
  } else {
    // Monthly mode: place a marker at the row whose month equals next month (the reset boundary).
    const nextMonth = history.nextMonthlyReset.slice(0, 7);
    const annualMonth = history.nextAnnualReset.slice(0, 7);
    if (rows.some((r) => r.key === nextMonth)) {
      out.push({ key: nextMonth, label: "Monthly reset" });
    }
    if (rows.some((r) => r.key === annualMonth) && annualMonth !== nextMonth) {
      out.push({ key: annualMonth, label: "Year reset" });
    }
  }
  return out;
}

export function EarnedIncomeForecastChart({
  history,
  limitCents,
  warnAtPercent,
}: {
  history: EarnedIncomeHistory;
  limitCents?: number | null;
  warnAtPercent?: number | null;
}) {
  const [range, setRange] = useState<Range>("6M");
  const mode: "daily" | "monthly" = range === "1M" ? "daily" : "monthly";

  const rows = useMemo<ChartRow[]>(() => {
    if (mode === "daily") {
      return buildDailyRows(history);
    }
    const monthsToShow =
      range === "3M" ? 3 : range === "6M" ? 6 : range === "1Y" ? 12 : "ALL";
    return buildMonthlyRows(history, monthsToShow);
  }, [history, range, mode]);

  const resetMarkers = useMemo(
    () => findResetMarkers(rows, history, mode),
    [rows, history, mode],
  );

  const warn =
    limitCents != null &&
    limitCents > 0 &&
    typeof warnAtPercent === "number" &&
    warnAtPercent > 0 &&
    warnAtPercent < 1
      ? Math.floor(limitCents * warnAtPercent)
      : null;

  // Compute a y-axis padding (5% above/below the data range) — the "stock-style cushion".
  const yPadding = useMemo(() => {
    const values: number[] = [];
    for (const r of rows) {
      if (r.actual != null) values.push(r.actual);
      if (r.projected != null) values.push(r.projected);
      if (r.bandHigh != null) values.push(r.bandHigh);
      if (r.bandLow != null) values.push(r.bandLow);
    }
    if (limitCents != null) values.push(limitCents);
    if (warn != null) values.push(warn);
    if (values.length === 0) return { min: 0, max: 100 };
    const max = Math.max(...values);
    const min = Math.min(...values, 0);
    const span = Math.max(1, max - min);
    return {
      min: Math.max(0, Math.floor(min - span * 0.05)),
      max: Math.ceil(max + span * 0.05),
    };
  }, [rows, limitCents, warn]);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--color-cs-text-secondary)]">
        No earned-income transactions yet.
      </p>
    );
  }

  const todayLabelKey =
    mode === "daily"
      ? history.today
      : history.today.slice(0, 7);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-[var(--color-cs-text-muted)]">
          {mode === "daily"
            ? "Cumulative MTD + projection"
            : "Monthly totals + projection"}
        </div>
        <div className="inline-flex overflow-hidden rounded-sm border border-[var(--color-cs-border)] text-[11px]">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setRange(o.value)}
              aria-pressed={range === o.value}
              className={
                range === o.value
                  ? "bg-[var(--color-cs-brand)] px-2 py-0.5 font-medium text-white"
                  : "bg-white px-2 py-0.5 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-cs-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-cs-text-muted)" />
            <YAxis
              width={56}
              tick={{ fontSize: 10 }}
              stroke="var(--color-cs-text-muted)"
              domain={[yPadding.min, yPadding.max]}
              tickFormatter={(v) => formatUsd(Number(v))}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label =
                  name === "actual"
                    ? "Actual"
                    : name === "projected"
                      ? "Projected"
                      : name === "bandHigh"
                        ? "Upper band"
                        : name === "bandLow"
                          ? "Lower band"
                          : name;
                return [formatUsd(value), label];
              }}
              contentStyle={{ fontSize: 12 }}
            />

            {/* Confidence band — render as a stacked area: bandLow as base, then (bandHigh - bandLow) on top.
                Recharts doesn't render true ranges with one Area, so we use two stacked Areas: an invisible
                base at bandLow, then a visible band of height (bandHigh - bandLow). */}
            <Area
              type="monotone"
              dataKey="bandLow"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey={(row: ChartRow) =>
                row.bandLow != null && row.bandHigh != null
                  ? row.bandHigh - row.bandLow
                  : null
              }
              name="band"
              stackId="band"
              stroke="none"
              fill="var(--color-cs-brand)"
              fillOpacity={0.12}
              isAnimationActive={false}
            />

            {/* Limit + warn horizontal references. */}
            {limitCents != null && limitCents > 0 ? (
              <ReferenceLine
                y={limitCents}
                stroke="#a4262c"
                strokeDasharray="4 4"
                label={{ value: "Limit", fill: "#a4262c", fontSize: 10, position: "insideTopRight" }}
              />
            ) : null}
            {warn != null ? (
              <ReferenceLine
                y={warn}
                stroke="#ca5010"
                strokeDasharray="3 3"
                label={{ value: "Watch", fill: "#ca5010", fontSize: 10, position: "insideTopRight" }}
              />
            ) : null}

            {/* Today marker. */}
            {rows.some((r) => r.key === todayLabelKey) ? (
              <ReferenceLine
                x={rows.find((r) => r.key === todayLabelKey)?.label}
                stroke="var(--color-cs-text-muted)"
                strokeDasharray="2 4"
                label={{ value: "Today", fill: "var(--color-cs-text-muted)", fontSize: 10, position: "top" }}
              />
            ) : null}

            {/* Threshold reset markers. */}
            {resetMarkers.map((rm) => (
              <ReferenceLine
                key={rm.key + rm.label}
                x={rows.find((r) => r.key === rm.key)?.label}
                stroke="var(--color-cs-brand)"
                strokeDasharray="1 3"
                label={{
                  value: rm.label,
                  fill: "var(--color-cs-brand)",
                  fontSize: 10,
                  position: "top",
                }}
              />
            ))}

            {mode === "monthly" ? (
              <>
                <Bar dataKey="actual" fill="var(--color-cs-brand)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="projected" fill="var(--color-cs-brand)" fillOpacity={0.35} radius={[2, 2, 0, 0]} />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--color-cs-brand)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="var(--color-cs-brand)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-cs-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[var(--color-cs-brand)]" />
          Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[var(--color-cs-brand)] opacity-35" />
          Projected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[var(--color-cs-brand)] opacity-15" />
          Range (±1σ)
        </span>
      </div>
    </div>
  );
}

