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

  it("flags a new income source and skips SNAP while gross income is under 130% FPL", () => {
    const actions = buildReportingActions({
      programs: ["SSDI", "SNAP"],
      rows: [],
      transactions: [
        tx("2026-05-03", -80000, "benefit_deposit", "SSA"),
        tx("2026-06-03", -90000, "earned_income", "NEW EMPLOYER LLC"),
      ],
      now: NOW,
    });
    const a = actions.find((x) => x.id.includes("new_work"));
    expect(a).toBeTruthy();
    expect(a!.severity).toBe("report");
    expect(a!.programs.map((p) => p.short)).toEqual(["SSDI"]);
    expect(a!.deadlineISO).toBeNull();
    expect(a!.playbookId).toBe("reporting_wage_change_10day");
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

  it("flags a raise for SSI on the 10th of next month, not an ordinary SNAP raise", () => {
    const raised = [
      tx("2026-05-03", -50000, "earned_income", "ACME"),
      tx("2026-06-03", -120000, "earned_income", "ACME"),
    ];
    const snap = buildReportingActions({ programs: ["SNAP"], rows: [], transactions: raised, now: NOW });
    expect(snap.find((x) => x.id.includes("increase"))).toBeUndefined();

    const ssi = buildReportingActions({ programs: ["SSI"], rows: [], transactions: raised, now: NOW });
    const a = ssi.find((x) => x.id.includes("increase"));
    expect(a).toBeTruthy();
    expect(a!.deadlineISO).toBe("2026-07-10T23:59:59.999Z");
    expect(a!.playbookId).toBe("reporting_wage_change_10day");
  });

  it("does not treat a third paycheck of the same size as a raise", () => {
    const actions = buildReportingActions({
      programs: ["SSI"],
      rows: [],
      transactions: [
        tx("2026-05-01", -100000, "earned_income", "ACME"),
        tx("2026-05-15", -100000, "earned_income", "ACME"),
        tx("2026-06-01", -100000, "earned_income", "ACME"),
        tx("2026-06-15", -100000, "earned_income", "ACME"),
        tx("2026-06-29", -100000, "earned_income", "ACME"),
      ],
      now: NOW,
    });
    expect(actions.find((x) => x.id.includes("wage-change"))).toBeUndefined();
  });

  it("flags being over an attached limit for the right program", () => {
    const actions = buildReportingActions({
      programs: ["MedicaidABD"],
      rows: [
        { thresholdType: "asset_balance", label: "PA ABD — asset limit", program: "MEDICAIDABD", status: "concern", attached: true },
      ],
      transactions: [],
      now: NOW,
    });
    const a = actions.find((x) => x.id === "over:medicaidabd");
    expect(a).toBeTruthy();
    expect(a!.programs[0].short).toBe("ABD Medicaid");
  });

  it("flags unusual non-wage deposits for review before month-end", () => {
    const actions = buildReportingActions({
      programs: ["SSI"],
      rows: [],
      transactions: [tx("2026-06-20", -180000, "other_income", "ESTATE OF SMITH")],
      now: NOW,
    });
    const a = actions.find((x) => x.id.startsWith("unusual-deposit:"));
    expect(a).toBeTruthy();
    expect(a!.severity).toBe("review");
    expect(a!.playbookId).toBe("reporting_lump_sum");
    expect(a!.detail).toMatch(/Do not give/i);
  });
});
