import { describe, expect, it } from "vitest";
import { evaluateWorkPlanner, SGA_NONBLIND_CENTS, TWP_SERVICE_CENTS } from "./work-planner";

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

  it("flags MAWD when wages are zero", () => {
    const rows = evaluateWorkPlanner({
      monthlyGrossWagesCents: 0,
      otherUnearnedCents: 1200_00,
      twpMonthsUsed: 0,
      overtimeIsTemporary: false,
    });
    expect(rows.find((r) => r.id === "mawd")?.status).toBe("concern");
  });
});
