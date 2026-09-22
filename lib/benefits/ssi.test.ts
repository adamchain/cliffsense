import { describe, it, expect } from "vitest";
import {
  SSI_FBR_INDIVIDUAL_CENTS,
  presumedMaxValueCents,
  estimateSsiWithSntPayment,
  ssiBenefitCentsToExclude,
  studentEarnedIncomeExclusionCents,
  ageMilestoneWindow,
  lumpSumNeedsReport,
  adjustedSsiCountable,
  ssiFbrCents,
  ssiResourceLimitCents,
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

describe("SSI alert figures", () => {
  it("uses the couple FBR and the $3,000 resource limit when the household is two or more", () => {
    expect(ssiFbrCents(1)).toBe(994_00);
    expect(ssiFbrCents(2)).toBe(1491_00);
    expect(ssiResourceLimitCents(1)).toBe(2000_00);
    expect(ssiResourceLimitCents(2)).toBe(3000_00);
  });

  it("leaves the SSI payment out of countable income", () => {
    expect(
      ssiBenefitCentsToExclude({
        programs: ["SSI"],
        householdSize: 1,
        deposits: [{ amountCents: 994_00, name: "SSA TREAS 310" }],
      }),
    ).toBe(994_00);
    const onlyTheCheck = adjustedSsiCountable({
      breakdown: { earnedNetCents: 0, earnedGrossCents: 0, benefitCents: 994_00, otherCents: 0 },
      programs: ["SSI"],
      householdSize: 1,
      benefitDeposits: [{ amountCents: 994_00, name: "SSA TREAS 310" }],
      age: 40,
      earnedGrossYearToDateBeforeMonthCents: 0,
    });
    expect(onlyTheCheck.countable).toBe(0);
  });

  it("keeps an SSDI deposit when the person is on both SSI and SSDI", () => {
    expect(
      ssiBenefitCentsToExclude({
        programs: ["SSI", "SSDI"],
        householdSize: 1,
        deposits: [
          { amountCents: 200_00, name: "SSI" },
          { amountCents: 1400_00, name: "SSDI" },
        ],
      }),
    ).toBe(200_00);
  });

  it("applies the student exclusion only under 22 and only up to the monthly cap", () => {
    expect(
      studentEarnedIncomeExclusionCents({
        age: 20,
        earnedGrossThisMonthCents: 3000_00,
        earnedGrossYearToDateBeforeMonthCents: 0,
      }),
    ).toBe(2410_00);
    expect(
      studentEarnedIncomeExclusionCents({
        age: 22,
        earnedGrossThisMonthCents: 3000_00,
        earnedGrossYearToDateBeforeMonthCents: 0,
      }),
    ).toBe(0);
  });

  it("opens the age-18 window in the months before the birthday", () => {
    const dob = new Date(Date.UTC(2008, 5, 15));
    const soon = new Date(Date.UTC(2026, 4, 1));
    const tooEarly = new Date(Date.UTC(2025, 11, 1));
    expect(ageMilestoneWindow(dob, 18, soon, 120, 30)).toBe(true);
    expect(ageMilestoneWindow(dob, 18, tooEarly, 120, 30)).toBe(false);
  });

  it("flags a deposit that would put resources over the limit, and a large receipt on its own", () => {
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 400_00,
        assetCents: 2200_00,
        programs: ["SSI"],
        householdSize: 1,
      }),
    ).toBe(true);
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 2000_00,
        assetCents: 500_00,
        programs: ["SSI"],
        householdSize: 1,
      }),
    ).toBe(true);
    expect(
      lumpSumNeedsReport({
        otherInflowCents: 200_00,
        assetCents: 1500_00,
        programs: ["SSI"],
        householdSize: 1,
      }),
    ).toBe(false);
  });
});
