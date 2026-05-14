import { describe, expect, it } from "vitest";
import {
  alignPredictionToMin,
  parseISODate,
  projectRecurringEarnedRestOfMonthCents,
  sumEarnedInflowTransactionsCents,
  utcMonthPrefix,
} from "./metrics";

describe("sumEarnedInflowTransactionsCents", () => {
  it("sums inflow earned_income in the month", () => {
    const rows = [
      { date: "2026-05-01", amountCents: -50000, userCategory: "earned_income", pending: false },
      { date: "2026-05-20", amountCents: 1000, userCategory: "earned_income", pending: false },
      { date: "2026-04-30", amountCents: -10000, userCategory: "earned_income", pending: false },
    ];
    expect(sumEarnedInflowTransactionsCents(rows, "2026-05")).toBe(50000);
  });

  it("skips transactions excluded from thresholds", () => {
    const rows = [
      {
        date: "2026-05-01",
        amountCents: -50000,
        userCategory: "earned_income",
        pending: false,
        excludedFromThresholds: true,
      },
      { date: "2026-05-02", amountCents: -1000, userCategory: "earned_income", pending: false },
    ];
    expect(sumEarnedInflowTransactionsCents(rows, "2026-05")).toBe(1000);
  });
});

describe("projectRecurringEarnedRestOfMonthCents", () => {
  it("counts weekly inflows after today through month end", () => {
    const now = new Date(Date.UTC(2026, 4, 14));
    const monthEnd = new Date(Date.UTC(2026, 4, 31, 23, 59, 59, 999));
    const streams = [
      {
        type: "inflow",
        userCategory: "earned_income",
        isConfirmed: true,
        frequency: "weekly",
        averageAmountCents: -25000,
        predictedNextDate: "2026-05-21",
      },
    ];
    const extra = projectRecurringEarnedRestOfMonthCents(streams, now, monthEnd);
    expect(extra).toBe(50000);
  });

  it("ignores excluded recurring streams", () => {
    const now = new Date(Date.UTC(2026, 4, 14));
    const monthEnd = new Date(Date.UTC(2026, 4, 31, 23, 59, 59, 999));
    const streams = [
      {
        type: "inflow",
        userCategory: "earned_income",
        isConfirmed: true,
        frequency: "weekly",
        averageAmountCents: -25000,
        predictedNextDate: "2026-05-21",
        excludedFromThresholds: true,
      },
    ];
    expect(projectRecurringEarnedRestOfMonthCents(streams, now, monthEnd)).toBe(0);
  });
});

describe("parseISODate / alignPredictionToMin", () => {
  it("aligns past prediction forward", () => {
    const min = parseISODate("2026-05-14")!;
    const aligned = alignPredictionToMin("2026-05-07", "weekly", min);
    expect(aligned).not.toBeNull();
    expect(aligned!.toISOString().slice(0, 10)).toBe("2026-05-14");
  });
});

describe("utcMonthPrefix", () => {
  it("returns YYYY-MM in UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 3));
    expect(utcMonthPrefix(d).prefix).toBe("2026-05");
  });
});
