import { describe, expect, it } from "vitest";
import {
  evaluateWorkPlanner,
  SGA_NONBLIND_CENTS,
  ssdiWageAlert,
  ssdiWaiverTwilight,
  TWP_SERVICE_CENTS,
} from "./work-planner";
import { workPlannerAskLinkLabel, workPlannerAskQuestion } from "./fix-prompts";

describe("work planner", () => {
  it("flags SSDI TWP then SGA after nine months", () => {
    const during = evaluateWorkPlanner({
      monthlyGrossWagesCents: TWP_SERVICE_CENTS,
      otherUnearnedCents: 0,
      twpMonthsUsed: 2,
      overtimeIsTemporary: false,
    });
    expect(during.find((r) => r.id === "ssdi")?.status).toBe("watch");

    const cliff = evaluateWorkPlanner({
      monthlyGrossWagesCents: SGA_NONBLIND_CENTS,
      otherUnearnedCents: 0,
      twpMonthsUsed: 9,
      overtimeIsTemporary: false,
    });
    expect(cliff.find((r) => r.id === "ssdi")?.status).toBe("concern");
  });

  it("keeps a month at SGA on the Trial Work Period until nine months are recorded", () => {
    expect(ssdiWageAlert(TWP_SERVICE_CENTS, 0)).toBe("twp");
    expect(ssdiWageAlert(SGA_NONBLIND_CENTS, 0)).toBe("twp");
    expect(ssdiWageAlert(SGA_NONBLIND_CENTS, 8)).toBe("twp");
    expect(ssdiWageAlert(SGA_NONBLIND_CENTS, 9)).toBe("sga");
    expect(ssdiWageAlert(TWP_SERVICE_CENTS - 1, 9)).toBeNull();
    expect(ssdiWaiverTwilight(SGA_NONBLIND_CENTS, 2000_00, 8)).toBe(false);
    expect(ssdiWaiverTwilight(SGA_NONBLIND_CENTS, 2000_00, 9)).toBe(true);
    expect(ssdiWaiverTwilight(SGA_NONBLIND_CENTS, 2982_00, 9)).toBe(false);
  });

  it("flags MAWD when wages are zero", () => {
    const rows = evaluateWorkPlanner({
      monthlyGrossWagesCents: 0,
      otherUnearnedCents: 1200_00,
      twpMonthsUsed: 0,
      overtimeIsTemporary: false,
    });
    expect(rows.find((r) => r.id === "mawd")?.status).toBe("concern");
  });

  it("maps planner status to ask / confirm / explain labels", () => {
    expect(workPlannerAskLinkLabel("ok")).toBe("Explain with AI");
    expect(workPlannerAskLinkLabel("watch")).toBe("Confirm with AI");
    expect(workPlannerAskLinkLabel("concern")).toBe("Ask AI what to do");
  });

  it("hands each planner card to the advisor with wages and the on-screen result", () => {
    const input = {
      monthlyGrossWagesCents: 0,
      otherUnearnedCents: 1200_00,
      twpMonthsUsed: 0,
      overtimeIsTemporary: false,
    };
    const rows = evaluateWorkPlanner(input);
    for (const row of rows) {
      const q = workPlannerAskQuestion({ ...row, ...input });
      expect(q).toContain(row.program === "Medicaid" ? "Medicaid" : row.program);
      expect(q).toContain(row.headline);
      expect(q).toMatch(/\$1,200\.00 unearned/);
      expect(q.length).toBeLessThanOrEqual(500);
    }
    expect(workPlannerAskQuestion({ ...rows.find((r) => r.id === "mawd")!, ...input })).toMatch(
      /What should I do next/,
    );
  });

  it("keeps overtime and SGA concern questions within the advisor ask length", () => {
    const overtimeRows = evaluateWorkPlanner({
      monthlyGrossWagesCents: 2800_00,
      otherUnearnedCents: 900_00,
      twpMonthsUsed: 4,
      overtimeIsTemporary: true,
    });
    const sgaRows = evaluateWorkPlanner({
      monthlyGrossWagesCents: SGA_NONBLIND_CENTS,
      otherUnearnedCents: 0,
      twpMonthsUsed: 9,
      overtimeIsTemporary: false,
    });
    for (const row of [...overtimeRows, ...sgaRows]) {
      const overtime = overtimeRows.includes(row);
      const q = workPlannerAskQuestion({
        ...row,
        monthlyGrossWagesCents: overtime ? 2800_00 : SGA_NONBLIND_CENTS,
        otherUnearnedCents: overtime ? 900_00 : 0,
        twpMonthsUsed: overtime ? 4 : 9,
        overtimeIsTemporary: overtime,
      });
      expect(q.length).toBeLessThanOrEqual(500);
    }
  });
});
