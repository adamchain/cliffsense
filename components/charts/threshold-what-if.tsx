"use client";

import { useMemo, useState } from "react";
import { IconArrowBackUp } from "@tabler/icons-react";

/* ---------------------------------------------------------------------------
 * A deliberately simple threshold view: one horizontal bar per limit showing
 * the current balance against its warn line and hard limit. A "what-if" panel
 * lets the user model an income raise or a change in savings and watch every
 * bar — and its status — react live, without touching their real data.
 * ------------------------------------------------------------------------- */

export type WhatIfItem = {
  id: string;
  label: string;
  kind: "income" | "asset";
  currentCents: number;
  projectedCents: number | null;
  limitCents: number;
  warnAtPercent: number;
};

type Status = "ok" | "watch" | "concern";

const STATUS_COLOR: Record<Status, string> = {
  ok: "var(--color-cs-success)",
  watch: "#ca5010",
  concern: "var(--color-cs-danger)",
};

const STATUS_BADGE: Record<Status, string> = {
  ok: "text-[#0e5e0e] bg-[var(--color-cs-success-bg)]",
  watch: "text-[#ca5010] bg-[#fff4ce]",
  concern: "text-[var(--color-cs-danger)] bg-[var(--color-cs-danger-bg)]",
};

const STATUS_LABEL: Record<Status, string> = {
  ok: "On track",
  watch: "Getting close",
  concern: "Over limit",
};

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Mirrors the server-side evaluation in threshold-dashboard.ts. */
function evaluate(kind: "income" | "asset", value: number, limit: number, warnAt: number): Status {
  const warnLine = Math.floor(limit * warnAt);
  if (kind === "asset") {
    if (value > limit) return "concern";
    if (value > warnLine) return "watch";
    return "ok";
  }
  if (value >= limit) return "concern";
  if (value >= warnLine) return "watch";
  return "ok";
}

/** Round a bound up to a friendly slider step. */
function niceStep(bound: number): number {
  const target = bound / 40;
  const steps = [2500, 5000, 10000, 25000, 50000]; // cents
  return steps.find((s) => s >= target) ?? 100000;
}

function Bar({
  value,
  limit,
  warnAt,
  status,
}: {
  value: number;
  limit: number;
  warnAt: number;
  status: Status;
}) {
  const pct = limit > 0 ? (value / limit) * 100 : 0;
  const fillPct = Math.max(0, Math.min(100, pct));
  const warnPct = Math.max(0, Math.min(100, warnAt * 100));
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-cs-surface)]">
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out"
        style={{ width: `${fillPct}%`, backgroundColor: STATUS_COLOR[status] }}
      />
      {/* Warn line */}
      <span
        aria-hidden
        className="absolute top-0 h-full w-px bg-[#ca5010]/70"
        style={{ left: `${warnPct}%` }}
      />
    </div>
  );
}

function Control({
  title,
  unit,
  delta,
  bound,
  step,
  onChange,
}: {
  title: string;
  unit: string;
  delta: number;
  bound: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-[var(--color-cs-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--color-cs-text)]">{title}</span>
        <span
          className={`tabular-nums text-[13px] font-semibold ${
            delta > 0
              ? "text-[var(--color-cs-success)]"
              : delta < 0
                ? "text-[var(--color-cs-danger)]"
                : "text-[var(--color-cs-text-secondary)]"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {formatUsd(delta)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={-bound}
        max={bound}
        step={step}
        value={delta}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2.5 w-full accent-[var(--color-cs-brand)]"
        aria-label={title}
      />
      <div className="mt-1 flex justify-between text-[10px] text-[var(--color-cs-text-muted)]">
        <span>−{formatUsd(bound)}</span>
        <span>+{formatUsd(bound)}</span>
      </div>
    </div>
  );
}

export function ThresholdWhatIf({ items }: { items: WhatIfItem[] }) {
  const [incomeDelta, setIncomeDelta] = useState(0);
  const [assetDelta, setAssetDelta] = useState(0);

  const hasIncome = items.some((i) => i.kind === "income");
  const hasAsset = items.some((i) => i.kind === "asset");

  const incomeBound = useMemo(() => {
    const max = Math.max(0, ...items.filter((i) => i.kind === "income").map((i) => i.limitCents));
    return max > 0 ? max : 300000; // default ±$3,000/mo
  }, [items]);
  const assetBound = useMemo(() => {
    const max = Math.max(0, ...items.filter((i) => i.kind === "asset").map((i) => i.limitCents));
    return max > 0 ? max : 500000; // default ±$5,000
  }, [items]);

  const adjusted = useMemo(
    () =>
      items.map((it) => {
        const delta = it.kind === "income" ? incomeDelta : assetDelta;
        const value = Math.max(0, it.currentCents + delta);
        return {
          ...it,
          adjustedCents: value,
          status: evaluate(it.kind, value, it.limitCents, it.warnAtPercent),
          baseStatus: evaluate(it.kind, it.currentCents, it.limitCents, it.warnAtPercent),
        };
      }),
    [items, incomeDelta, assetDelta],
  );

  const isWhatIf = incomeDelta !== 0 || assetDelta !== 0;

  if (items.length === 0) {
    return (
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Connect a bank and confirm your enrolled programs — your earned-income and asset limits will
        appear here with a live bar for each.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* What-if controls */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {hasIncome ? (
          <Control
            title="What if my monthly income changes?"
            unit="/mo"
            delta={incomeDelta}
            bound={incomeBound}
            step={niceStep(incomeBound)}
            onChange={setIncomeDelta}
          />
        ) : null}
        {hasAsset ? (
          <Control
            title="What if my balance changes?"
            unit=""
            delta={assetDelta}
            bound={assetBound}
            step={niceStep(assetBound)}
            onChange={setAssetDelta}
          />
        ) : null}
      </div>

      {isWhatIf ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-cs-brand)]/25 bg-[var(--color-cs-info-bg)] px-3 py-2">
          <span className="text-[12px] font-medium text-[var(--color-cs-brand)]">
            Showing a hypothetical — your real balances are unchanged.
          </span>
          <button
            type="button"
            onClick={() => {
              setIncomeDelta(0);
              setAssetDelta(0);
            }}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-cs-brand)] hover:underline"
          >
            <IconArrowBackUp size={14} stroke={2} aria-hidden />
            Reset
          </button>
        </div>
      ) : null}

      {/* Bars */}
      <ul className="flex flex-col gap-4">
        {adjusted.map((it) => {
          const headroom = it.limitCents - it.adjustedCents;
          const changed = isWhatIf && it.status !== it.baseStatus;
          return (
            <li key={it.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-cs-text)]">
                  {it.label}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[it.status]}`}
                >
                  {STATUS_LABEL[it.status]}
                  {changed ? " ›" : ""}
                </span>
              </div>
              <Bar
                value={it.adjustedCents}
                limit={it.limitCents}
                warnAt={it.warnAtPercent}
                status={it.status}
              />
              <div className="flex items-center justify-between text-[11px] text-[var(--color-cs-text-secondary)]">
                <span className="tabular-nums">
                  <span className="font-medium text-[var(--color-cs-text)]">
                    {formatUsd(it.adjustedCents)}
                  </span>{" "}
                  of {formatUsd(it.limitCents)} limit
                </span>
                <span className="tabular-nums">
                  {headroom >= 0
                    ? `${formatUsd(headroom)} left`
                    : `${formatUsd(-headroom)} over`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
        The thin orange line marks the warning level; the end of each bar is the hard limit.
        Informational only — not a determination of eligibility.
      </p>
    </div>
  );
}
