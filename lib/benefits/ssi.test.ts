import { describe, it, expect } from "vitest";
import {
  SSI_FBR_INDIVIDUAL_CENTS,
  presumedMaxValueCents,
  estimateSsiWithSntPayment,
} from "@/lib/benefits/ssi";

describe("SSI FBR / PMV (2026)", () => {
  it("FBR individual is $994", () => {
    expect(SSI_FBR_INDIVIDUAL_CENTS).toBe(994_00);
  });

  it("PMV = 1/3 FBR + $20 ≈ $351.33", () => {
    expect(presumedMaxValueCents()).toBe(351_33);
  });
});

describe("estimateSsiWithSntPayment", () => {
  it("shelter over the cap reduces the check by ~$331.33, leaving ~$662.67", () => {
    const r = estimateSsiWithSntPayment({ paymentType: "shelter", amountCents: 1500_00 });
    expect(r.countedValueCents).toBe(351_33); // capped at PMV
    expect(r.reductionCents).toBe(331_33); // net of the $20 general exclusion
    expect(r.ssiCents).toBe(662_67);
  });

  it("cash counts dollar-for-dollar after the $20 exclusion ($500 → -$480)", () => {
    const r = estimateSsiWithSntPayment({ paymentType: "cash", amountCents: 500_00 });
    expect(r.reductionCents).toBe(480_00);
    expect(r.ssiCents).toBe(514_00);
  });

  it("large cash can zero out the check", () => {
    const r = estimateSsiWithSntPayment({ paymentType: "cash", amountCents: 2000_00 });
    expect(r.ssiCents).toBe(0);
  });

  it("food / non-shelter to a vendor is fully excluded — no reduction", () => {
    const r = estimateSsiWithSntPayment({ paymentType: "food_nonshelter", amountCents: 1500_00 });
    expect(r.countedValueCents).toBe(0);
    expect(r.reductionCents).toBe(0);
    expect(r.ssiCents).toBe(SSI_FBR_INDIVIDUAL_CENTS);
  });

  it("shelter below the cap counts only the actual value", () => {
    const r = estimateSsiWithSntPayment({ paymentType: "shelter", amountCents: 100_00 });
    expect(r.countedValueCents).toBe(100_00);
    expect(r.reductionCents).toBe(80_00); // $100 - $20 general exclusion
  });

  it("existing unearned income already consumes the $20 general exclusion", () => {
    const r = estimateSsiWithSntPayment({
      paymentType: "shelter",
      amountCents: 1500_00,
      otherUnearnedCents: 300_00,
    });
    // countable = 351.33 (ISM) + 300 (other) - 20 = 631.33
    expect(r.countableCents).toBe(631_33);
    expect(r.ssiCents).toBe(994_00 - 631_33);
  });
});
