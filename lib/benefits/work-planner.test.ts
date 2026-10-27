import { describe, expect, it } from "vitest";
import {
  evaluateWorkPlanner,
  SGA_NONBLIND_CENTS,
  dacSgaAlert,
  dacWaiverTwilight,
  ssdiWageAlert,
  ssdiWaiverTwilight,
  TWP_SERVICE_CENTS,
} from "./work-planner";

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

  it("treats DAC SGA as a disability-finding line with no trial work period", () => {
    expect(dacSgaAlert(Math.floor(SGA_NONBLIND_CENTS * 0.85) - 1)).toBeNull();
    expect(dacSgaAlert(Math.floor(SGA_NONBLIND_CENTS * 0.85))).toBe("warning");
    expect(dacSgaAlert(SGA_NONBLIND_CENTS)).toBe("breach");
    expect(dacWaiverTwilight(SGA_NONBLIND_CENTS, 2000_00)).toBe(true);
    expect(dacWaiverTwilight(SGA_NONBLIND_CENTS - 1, 2000_00)).toBe(false);
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
