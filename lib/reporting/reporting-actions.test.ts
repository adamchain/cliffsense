import { describe, expect, it } from "vitest";
import { buildReportingActions, type ReportingTx } from "./reporting-actions";

const NOW = new Date("2026-06-15T00:00:00.000Z");
const tx = (date: string, cents: number, cat: string, name?: string): ReportingTx => ({
  date,
  amountCents: cents,
  userCategory: cat,
  name,
  pending: false,
  excludedFromThresholds: false,
});

describe("buildReportingActions", () => {
  it("returns nothing when no enrolled programs have rules", () => {
    expect(buildReportingActions({ programs: ["LIHEAP"], rows: [], transactions: [], now: NOW })).toEqual([]);
  });

  it("flags a new income source this month and targets work-reporting programs", () => {
    const actions = buildReportingActions({
      programs: ["SSDI", "SNAP"],
      rows: [],
      transactions: [tx("2026-06-03", -90000, "earned_income", "NEW EMPLOYER LLC")],
      now: NOW,
    });
    const a = actions.find((x) => x.id.startsWith("new-work:"));
    expect(a).toBeTruthy();
    expect(a!.severity).toBe("report");
    expect(a!.programs.map((p) => p.short).sort()).toEqual(["SNAP", "SSDI"]);
    expect(a!.deadlineISO).toBe("2026-07-10T23:59:59.999Z"); // 10th of next month
  });

  it("does not flag a payer seen in a prior month", () => {
    const actions = buildReportingActions({
      programs: ["SSDI"],
      rows: [],
      transactions: [
        tx("2026-04-03", -90000, "earned_income", "ACME"),
        tx("2026-06-03", -90000, "earned_income", "ACME"),
      ],
      now: NOW,
    });
    expect(actions.find((x) => x.id.startsWith("new-work:"))).toBeUndefined();
  });

  it("flags an income jump vs the trailing average (same employer)", () => {
    const actions = buildReportingActions({
      programs: ["SNAP"],
      rows: [],
      transactions: [
        tx("2026-04-03", -50000, "earned_income", "ACME"),
        tx("2026-05-03", -50000, "earned_income", "ACME"),
        tx("2026-06-03", -120000, "earned_income", "ACME"),
      ],
      now: NOW,
    });
    expect(actions.find((x) => x.id.startsWith("income-jump:"))).toBeTruthy();
  });

  it("flags being over an attached limit for the right program", () => {
    const actions = buildReportingActions({
      programs: ["Medicaid"],
      rows: [
        { thresholdType: "asset_balance", label: "PA ABD — asset limit", program: "MEDICAID", status: "concern", attached: true },
      ],
      transactions: [],
      now: NOW,
    });
    const a = actions.find((x) => x.id === "over:medicaid");
    expect(a).toBeTruthy();
    expect(a!.programs[0].short).toBe("Medicaid");
  });
});
