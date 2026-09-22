import { describe, expect, it } from "vitest";
import {
  detectWageChange,
  programsThatMustReportWageChange,
  snapGross130Cents,
  type WageDeposit,
} from "./wage-change";

const NOW = new Date("2026-06-15T00:00:00.000Z");
const LATE = new Date("2026-06-22T00:00:00.000Z");

function dep(date: string, cents: number, payer = "acme"): WageDeposit {
  return { date, amountCents: cents, payerKey: payer };
}

describe("detectWageChange", () => {
  it("flags a payer that was not in earlier months", () => {
    expect(
      detectWageChange({
        monthPrefix: "2026-06",
        now: NOW,
        hasHistoryBeforeMonth: true,
        deposits: [
          dep("2026-05-03", 80_000, "old employer"),
          dep("2026-06-03", 90_000, "new employer"),
        ],
      }),
    ).toBe("new_work");
  });

  it("does not treat the first synced month of an existing job as new work", () => {
    expect(
      detectWageChange({
        monthPrefix: "2026-06",
        now: NOW,
        deposits: [dep("2026-06-03", 90_000, "acme")],
      }),
    ).toBeNull();
  });

  it("flags a raise from the average paycheck, including a partial month", () => {
    expect(
      detectWageChange({
        monthPrefix: "2026-06",
        now: NOW,
        deposits: [
          dep("2026-05-01", 100_000),
          dep("2026-05-15", 100_000),
          dep("2026-06-01", 130_000),
        ],
      }),
    ).toBe("increase");
  });

  it("ignores a third paycheck when the check size is unchanged", () => {
    expect(
      detectWageChange({
        monthPrefix: "2026-06",
        now: LATE,
        deposits: [
          dep("2026-05-01", 100_000),
          dep("2026-05-15", 100_000),
          dep("2026-06-01", 100_000),
          dep("2026-06-15", 100_000),
          dep("2026-06-29", 100_000),
        ],
      }),
    ).toBeNull();
  });

  it("flags a smaller paycheck", () => {
    expect(
      detectWageChange({
        monthPrefix: "2026-06",
        now: NOW,
        deposits: [
          dep("2026-05-01", 150_000),
          dep("2026-05-15", 150_000),
          dep("2026-06-01", 100_000),
        ],
      }),
    ).toBe("decrease");
  });

  it("flags stopped work only after the 21st", () => {
    const deposits = [dep("2026-05-01", 100_000), dep("2026-05-15", 100_000)];
    expect(detectWageChange({ monthPrefix: "2026-06", now: NOW, deposits })).toBeNull();
    expect(detectWageChange({ monthPrefix: "2026-06", now: LATE, deposits })).toBe("stopped");
  });
});

describe("programsThatMustReportWageChange", () => {
  it("uses 130% of the SNAP 200% table for a household of 1", () => {
    expect(snapGross130Cents(1)).toBe(169_650);
  });

  it("keeps an ordinary SNAP raise off the reporting list", () => {
    expect(programsThatMustReportWageChange(["SNAP"], "increase", 120_000, 1)).toEqual([]);
  });

  it("includes SNAP once gross income is over 130% FPL, and always includes SSI", () => {
    expect(programsThatMustReportWageChange(["SNAP", "SSI"], "increase", 120_000, 1)).toEqual(["SSI"]);
    expect(programsThatMustReportWageChange(["SNAP"], "increase", 200_000, 1)).toEqual(["SNAP"]);
  });

  it("does not send a pay cut to SNAP", () => {
    expect(programsThatMustReportWageChange(["SNAP", "SSDI"], "decrease", 300_000, 1)).toEqual(["SSDI"]);
  });

  it("includes MAGI and Extra Help", () => {
    expect(
      programsThatMustReportWageChange(["MedicaidMAGI", "ExtraHelp"], "new_work", 50_000, 1),
    ).toEqual(["MedicaidMAGI", "ExtraHelp"]);
  });
});
