import { describe, expect, it } from "vitest";
import {
  extraHelpIncomeAlert,
  extraHelpIncomeBeforeGeneralExclusionCents,
  extraHelpIncomeLimitCents,
  extraHelpIsAutomatic,
  extraHelpResourceAlert,
  extraHelpResourceLimitCents,
} from "@/lib/benefits/extra-help-limits";

describe("Extra Help limits", () => {
  it("uses the 2026 individual and couple amounts", () => {
    expect(extraHelpIncomeLimitCents(1)).toBe(2015_00);
    expect(extraHelpIncomeLimitCents(2)).toBe(2725_00);
    expect(extraHelpResourceLimitCents(1)).toBe(18090_00);
    expect(extraHelpResourceLimitCents(2)).toBe(36100_00);
  });

  it("does not subtract the $20 that is already inside the published limit", () => {
    expect(
      extraHelpIncomeBeforeGeneralExclusionCents({
        earnedNetCents: 0,
        earnedGrossCents: 0,
        benefitCents: 2015_00,
        otherCents: 0,
      }),
    ).toBe(2015_00);
  });

  it("is Important when income or resources reach the limit", () => {
    expect(extraHelpIncomeAlert(2014_00, 2015_00)).toBe("warning");
    expect(extraHelpIncomeAlert(2015_00, 2015_00)).toBe("breach");
    expect(extraHelpResourceAlert(18089_00, 18090_00)).toBe("warning");
    expect(extraHelpResourceAlert(18090_00, 18090_00)).toBe("breach");
  });

  it("treats Medicaid, QMB, and SSI as automatic Extra Help", () => {
    expect(extraHelpIsAutomatic(["ExtraHelp", "SSI"])).toBe(true);
    expect(extraHelpIsAutomatic(["ExtraHelp", "QMB"])).toBe(true);
    expect(extraHelpIsAutomatic(["ExtraHelp", "MedicaidABD"])).toBe(true);
    expect(extraHelpIsAutomatic(["ExtraHelp", "SSDI"])).toBe(false);
  });
});
