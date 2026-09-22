import { describe, expect, it } from "vitest";
import {
  waiverGrossCountableCents,
  waiverIncomeAlert,
  waiverResourceAlert,
} from "@/lib/benefits/waiver-limits";

describe("HCBS waiver limits", () => {
  it("keeps wages and SSDI, and leaves out a DAC benefit", () => {
    const gross = waiverGrossCountableCents({
      breakdown: {
        earnedNetCents: 1000_00,
        earnedGrossCents: 1130_00,
        benefitCents: 700_00,
        otherCents: 0,
      },
      programs: ["MedicaidWaiver", "DAC"],
      deposits: [{ amountCents: 700_00, name: "SSA" }],
    });
    expect(gross).toBe(1130_00);
  });

  it("warns while approaching and is Important only when income is over $2,982", () => {
    expect(waiverIncomeAlert(2982_00)).toBe("warning");
    expect(waiverIncomeAlert(2982_01)).toBe("breach");
    expect(waiverIncomeAlert(2500_00)).toBeNull();
  });

  it("is Important only when resources are over $8,000", () => {
    expect(waiverResourceAlert(8000_00)).toBe("warning");
    expect(waiverResourceAlert(8000_01)).toBe("breach");
    expect(waiverResourceAlert(6800_00)).toBeNull();
  });
});
