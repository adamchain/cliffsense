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

const COLOR_BRAND = "var(--color-cs-brand)";
const COLOR_LIMIT = "#a4262c";
const COLOR_WATCH = "#ca5010";
const COLOR_TODAY = "#605e5c";

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatUsdCompact(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1000) {
    const k = dollars / 1000;
    const rounded = Math.abs(k) >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `$${rounded}k`;
  }
  return `$${Math.round(dollars)}`;
}

function shortMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function longMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function longDayLabel(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
  day?: string;
};

function buildMonthlyRows(history: EarnedIncomeHistory, monthsToShow: number | "ALL"): ChartRow[] {
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
    if (rows.length > 0) out.push({ key: rows[rows.length - 1].key, label: "Reset" });
  } else {
    const nextMonth = history.nextMonthlyReset.slice(0, 7);
    const annualMonth = history.nextAnnualReset.slice(0, 7);
    if (rows.some((r) => r.key === nextMonth)) {
      out.push({ key: nextMonth, label: "Mo. reset" });
    }
    if (rows.some((r) => r.key === annualMonth) && annualMonth !== nextMonth) {
      out.push({ key: annualMonth, label: "Yr. reset" });
    }
  }
  return out;
}

type TooltipPayload = {
  active?: boolean;
  payload?: { name?: string; value?: number; dataKey?: string }[];
  label?: string;
};

function ChartTooltip(
  {
    active,
    payload,
    label,
    mode,
  }: TooltipPayload & { mode: "daily" | "monthly" },
) {
  if (!active || !payload || payload.length === 0) return null;
  const row = (payload[0] as unknown as { payload: ChartRow }).payload;
  const heading =
    mode === "daily" && row.day
      ? longDayLabel(row.day)
      : mode === "monthly"
        ? longMonthLabel(row.key)
        : label ?? "";
  const seen = new Set<string>();
  const lines: { key: string; label: string; value: string }[] = [];
  for (const item of payload) {
    const dk = String(item.dataKey ?? "");
    if (!dk || seen.has(dk)) continue;
    seen.add(dk);
    const v = typeof item.value === "number" ? item.value : null;
    if (v == null) continue;
    if (dk === "actual") lines.push({ key: dk, label: "Actual", value: formatUsd(v) });
    else if (dk === "projected") lines.push({ key: dk, label: "Projected", value: formatUsd(v) });
    else if (dk === "bandLow") lines.push({ key: dk, label: "Lower band", value: formatUsd(v) });
    else if (dk === "bandHigh") lines.push({ key: dk, label: "Upper band", value: formatUsd(v) });
  }
  if (lines.length === 0) return null;
  return (
    <div className="rounded border border-[var(--color-cs-border)] bg-white px-2.5 py-1.5 shadow-sm">
      <div className="text-[11px] font-medium text-[var(--color-cs-text)]">{heading}</div>
      <ul className="mt-0.5 space-y-0.5">
        {lines.map((l) => (
          <li
            key={l.key}
            className="flex items-center justify-between gap-3 text-[11px] text-[var(--color-cs-text-secondary)]"
          >
            <span>{l.label}</span>
            <span className="tabular-nums text-[var(--color-cs-text)]">{l.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendDot({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-3 rounded-sm"
      style={{ backgroundColor: color, opacity }}
    />
  );
}

function LegendDashedH({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-[2px] w-4"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 7px)`,
      }}
    />
  );
}

function LegendDashedV({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-[2px]"
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0 3px, transparent 3px 6px)`,
      }}
    />
  );
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
    if (mode === "daily") return buildDailyRows(history);
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

  const yDomain = useMemo<[number, number]>(() => {
    const values: number[] = [];
    for (const r of rows) {
      if (r.actual != null) values.push(r.actual);
      if (r.projected != null) values.push(r.projected);
      if (r.bandHigh != null) values.push(r.bandHigh);
      if (r.bandLow != null) values.push(r.bandLow);
    }
    if (limitCents != null) values.push(limitCents);
    if (warn != null) values.push(warn);
    if (values.length === 0) return [0, 100];
    const max = Math.max(...values);
    const min = Math.min(...values, 0);
    const span = Math.max(1, max - min);
    return [
      Math.max(0, Math.floor(min - span * 0.06)),
      Math.ceil(max + span * 0.12),
    ];
  }, [rows, limitCents, warn]);

  const todayKey = mode === "daily" ? history.today : history.today.slice(0, 7);
  const todayLabel = rows.find((r) => r.key === todayKey)?.label;
  const tickInterval = rows.length > 14 ? Math.ceil(rows.length / 8) - 1 : 0;

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--color-cs-text-secondary)]">
        No earned-income transactions yet.
      </p>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          {mode === "daily" ? "Cumulative MTD + projection" : "Monthly totals + projection"}
        </span>
        <div className="flex items-center gap-3">
          {limitCents != null && limitCents > 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-cs-text-secondary)]">
              <LegendDashedH color={COLOR_LIMIT} />
              <span>
                Limit{" "}
                <span className="tabular-nums text-[var(--color-cs-text)]">{formatUsd(limitCents)}</span>
              </span>
            </span>
          ) : null}
          {warn != null ? (
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-cs-text-secondary)]">
              <LegendDashedH color={COLOR_WATCH} />
              <span>
                Watch{" "}
                <span className="tabular-nums text-[var(--color-cs-text)]">{formatUsd(warn)}</span>
              </span>
            </span>
          ) : null}
          <div
            className="inline-flex overflow-hidden rounded-sm border border-[var(--color-cs-border)] text-[11px]"
            role="tablist"
            aria-label="Time range"
          >
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setRange(o.value)}
                aria-pressed={range === o.value}
                role="tab"
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
      </div>

      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-cs-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-cs-text-muted)" }}
              stroke="var(--color-cs-border)"
              tickLine={false}
              interval={tickInterval}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              width={52}
              tick={{ fontSize: 10, fill: "var(--color-cs-text-muted)" }}
              stroke="var(--color-cs-border)"
              tickLine={false}
              domain={yDomain}
              tickFormatter={(v) => formatUsdCompact(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-cs-border)", strokeWidth: 1 }}
              content={(p) => <ChartTooltip {...(p as TooltipPayload)} mode={mode} />}
            />

            {/* Confidence band — invisible base + visible delta on top, stacked. */}
            <Area
              type="monotone"
              dataKey="bandLow"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey={(row: ChartRow) =>
                row.bandLow != null && row.bandHigh != null ? row.bandHigh - row.bandLow : null
              }
              name="band"
              stackId="band"
              stroke="none"
              fill={COLOR_BRAND}
              fillOpacity={0.1}
              isAnimationActive={false}
              legendType="none"
            />

            {/* Horizontal references — no labels (legend handles them). */}
            {limitCents != null && limitCents > 0 ? (
              <ReferenceLine y={limitCents} stroke={COLOR_LIMIT} strokeDasharray="4 4" />
            ) : null}
            {warn != null ? (
              <ReferenceLine y={warn} stroke={COLOR_WATCH} strokeDasharray="3 3" />
            ) : null}

            {/* Today marker — label sits inside the plot at the top. */}
            {todayLabel ? (
              <ReferenceLine
                x={todayLabel}
                stroke={COLOR_TODAY}
                strokeDasharray="2 4"
                label={{
                  value: "Today",
                  fill: COLOR_TODAY,
                  fontSize: 10,
                  position: "insideTop",
                  offset: 8,
                }}
              />
            ) : null}

            {/* Reset markers — label inside the plot at top-right. */}
            {resetMarkers.map((rm, i) => {
              const x = rows.find((r) => r.key === rm.key)?.label;
              if (!x) return null;
              return (
                <ReferenceLine
                  key={rm.key + rm.label}
                  x={x}
                  stroke={COLOR_BRAND}
                  strokeDasharray="1 3"
                  label={{
                    value: rm.label,
                    fill: COLOR_BRAND,
                    fontSize: 10,
                    position: i === 0 ? "insideTopRight" : "insideTop",
                    offset: 8,
                  }}
                />
              );
            })}

            {mode === "monthly" ? (
              <>
                <Bar
                  dataKey="actual"
                  fill={COLOR_BRAND}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="projected"
                  fill={COLOR_BRAND}
                  fillOpacity={0.35}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={COLOR_BRAND}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke={COLOR_BRAND}
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-cs-text-muted)]">
        <span className="flex items-center gap-1.5">
          <LegendDot color={COLOR_BRAND} />
          Actual
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot color={COLOR_BRAND} opacity={0.35} />
          Projected
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot color={COLOR_BRAND} opacity={0.1} />
          Range (±1σ)
        </span>
        {todayLabel ? (
          <span className="flex items-center gap-1.5">
            <LegendDashedV color={COLOR_TODAY} />
            Today
          </span>
        ) : null}
        {resetMarkers.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <LegendDashedV color={COLOR_BRAND} />
            Threshold reset
          </span>
        ) : null}
      </div>
    </div>
  );
}
