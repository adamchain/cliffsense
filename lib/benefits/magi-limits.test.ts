import { describe, expect, it } from "vitest";
import { magiAdultAgeApplies, magiAdultIncomeAlert, magiAdultIncomeLimitCents } from "@/lib/benefits/magi-limits";

describe("MAGI adult income limits", () => {
  it("uses the 2026 HealthChoices amounts", () => {
    expect(magiAdultIncomeLimitCents(1)).toBe(1836_00);
    expect(magiAdultIncomeLimitCents(2)).toBe(2489_00);
    expect(magiAdultIncomeLimitCents(3)).toBe(3142_00);
    expect(magiAdultIncomeLimitCents(4)).toBe(3795_00);
    expect(magiAdultIncomeLimitCents(8)).toBe(Math.ceil(76894 / 12) * 100);
  });

  it("is Important only when income is over the limit", () => {
    expect(magiAdultIncomeAlert(1836_00, 1836_00)).toBe("warning");
    expect(magiAdultIncomeAlert(1836_01, 1836_00)).toBe("breach");
    expect(magiAdultIncomeAlert(1500_00, 1836_00)).toBeNull();
  });

  it("applies the adult line from 19 through 64", () => {
    expect(magiAdultAgeApplies(19)).toBe(true);
    expect(magiAdultAgeApplies(64)).toBe(true);
    expect(magiAdultAgeApplies(18)).toBe(false);
    expect(magiAdultAgeApplies(65)).toBe(false);
    expect(magiAdultAgeApplies(null)).toBe(true);
  });
});
