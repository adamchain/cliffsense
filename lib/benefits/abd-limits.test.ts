import { describe, expect, it } from "vitest";
import { abdCountableCents, lumpSumNeedsReport } from "@/lib/benefits/ssi";
import { abdIncomeLimitCents, abdResourceLimitCents } from "@/lib/benefits/abd-limits";

describe("Healthy Horizons ABD limits", () => {
  it("uses the 2026 poverty guideline for each household size", () => {
    expect(abdIncomeLimitCents(1)).toBe(1330_00);
    expect(abdIncomeLimitCents(2)).toBe(1804_00);
    expect(abdIncomeLimitCents(3)).toBe(2277_00);
    expect(abdIncomeLimitCents(4)).toBe(2750_00);
    expect(abdIncomeLimitCents(5)).toBe(3224_00);
    expect(abdIncomeLimitCents(6)).toBe(3697_00);
    expect(abdIncomeLimitCents(8)).toBe(4644_00);
  });

  it("uses $3,000 for two or more, $8,000 on a waiver, and skips the test under 21", () => {
    expect(abdResourceLimitCents({ householdSize: 1, onWaiver: false, age: 40 })).toBe(2000_00);
    expect(abdResourceLimitCents({ householdSize: 2, onWaiver: false, age: 40 })).toBe(3000_00);
    expect(abdResourceLimitCents({ householdSize: 1, onWaiver: true, age: 40 })).toBe(8000_00);
    expect(abdResourceLimitCents({ householdSize: 1, onWaiver: false, age: 20 })).toBeNull();
    expect(abdResourceLimitCents({ householdSize: 1, onWaiver: false, age: 21 })).toBe(2000_00);
    expect(abdResourceLimitCents({ householdSize: 1, onWaiver: false, age: null })).toBe(2000_00);
  });

  it("leaves out the SSI payment and a DAC benefit, and keeps SSDI", () => {
    const wagesOnly = abdCountableCents({
      breakdown: {
        earnedNetCents: 0,
        earnedGrossCents: 0,
        benefitCents: 994_00 + 900_00,
        otherCents: 0,
      },
      programs: ["MedicaidABD", "SSI", "SSDI"],
      householdSize: 1,
      deposits: [
        { amountCents: 994_00, name: "SSI" },
        { amountCents: 900_00, name: "SSDI" },
      ],
    });
    expect(wagesOnly).toBe(880_00);

    const dacOnly = abdCountableCents({
      breakdown: {
        earnedNetCents: 0,
        earnedGrossCents: 0,
        benefitCents: 700_00,
        otherCents: 0,
      },
      programs: ["MedicaidABD", "DAC"],
      householdSize: 1,
      deposits: [{ amountCents: 700_00, name: "SSA" }],
    });
    expect(dacOnly).toBe(0);
  });

  it("uses $3,000 when an ABD household of two would cross the resource line", () => {
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 400_00,
        assetCents: 2200_00,
        programs: ["MedicaidABD"],
        householdSize: 2,
      }),
    ).toBe(false);
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 400_00,
        assetCents: 3200_00,
        programs: ["MedicaidABD"],
        householdSize: 2,
      }),
    ).toBe(true);
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 400_00,
        assetCents: 3200_00,
        programs: ["Medicaid"],
        householdSize: 1,
      }),
    ).toBe(false);
  });
});
