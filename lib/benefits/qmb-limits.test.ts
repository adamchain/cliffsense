import { describe, expect, it } from "vitest";
import {
  qmbIncomeAlert,
  qmbIncomeBeforeGeneralExclusionCents,
  qmbIncomeLimitCents,
  qmbResourceAlert,
  qmbResourceLimitCents,
} from "@/lib/benefits/qmb-limits";

describe("QMB limits", () => {
  it("uses the 2026 individual and couple amounts", () => {
    expect(qmbIncomeLimitCents(1)).toBe(1350_00);
    expect(qmbIncomeLimitCents(2)).toBe(1824_00);
    expect(qmbResourceLimitCents(1)).toBe(9950_00);
    expect(qmbResourceLimitCents(2)).toBe(14910_00);
  });

  it("does not subtract the $20 that is already inside the published limit", () => {
    expect(
      qmbIncomeBeforeGeneralExclusionCents({
        earnedNetCents: 0,
        earnedGrossCents: 0,
        benefitCents: 1350_00,
        otherCents: 0,
      }),
    ).toBe(1350_00);
  });

  it("still halves earned income after the $65 exclusion", () => {
    expect(
      qmbIncomeBeforeGeneralExclusionCents({
        earnedNetCents: 265_00,
        earnedGrossCents: 265_00,
        benefitCents: 0,
        otherCents: 0,
      }),
    ).toBe(100_00);
  });

  it("is Important only when income or resources are over the limit", () => {
    expect(qmbIncomeAlert(1350_00, 1350_00)).toBe("warning");
    expect(qmbIncomeAlert(1350_01, 1350_00)).toBe("breach");
    expect(qmbResourceAlert(9950_00, 9950_00)).toBe("warning");
    expect(qmbResourceAlert(9950_01, 9950_00)).toBe("breach");
  });
});
