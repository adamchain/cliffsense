import { describe, expect, it } from "vitest";
import {
  isSubstantialGamblingWin,
  oneTimeOtherIncomeCents,
  snapGross130Cents,
  snapGross200Cents,
  snapGrossDisplayStatus,
  snapStoredGrossLimitCents,
} from "./snap-limits";

describe("SNAP income limits (Oct 2026–Sep 2027)", () => {
  it("uses the Pennsylvania 200% table and $948 for each person after 8", () => {
    expect(snapGross200Cents(1)).toBe(2660_00);
    expect(snapGross200Cents(2)).toBe(3608_00);
    expect(snapGross200Cents(4)).toBe(5500_00);
    expect(snapGross200Cents(6)).toBe(7394_00);
    expect(snapGross200Cents(7)).toBe(8340_00);
    expect(snapGross200Cents(9)).toBe(9288_00 + 948_00);
  });

  it("marks income between the 130% reporting line and the 200% guide as a reporting review", () => {
    expect(
      snapGrossDisplayStatus({
        currentCents: 2000_00,
        eligibilityLimitCents: 2660_00,
        householdSize: 1,
      }),
    ).toEqual({ status: "watch", reportingDue: true });
    expect(
      snapGrossDisplayStatus({
        currentCents: 1729_00,
        eligibilityLimitCents: 2660_00,
        householdSize: 1,
      }),
    ).toEqual({ status: "ok", reportingDue: false });
    expect(
      snapGrossDisplayStatus({
        currentCents: 2700_00,
        eligibilityLimitCents: 2660_00,
        householdSize: 1,
      }).status,
    ).toBe("concern");
  });

  it("uses the federal 130% table and fires only when income is over the line", () => {
    expect(snapGross130Cents(1)).toBe(1729_00);
    expect(snapGross130Cents(2)).toBe(2345_00);
    expect(snapGross130Cents(4)).toBe(3575_00);
    expect(snapGross130Cents(9)).toBe(6037_00 + 616_00);
  });

  it("adds $948 on the stored 8-person limit for larger households", () => {
    expect(snapStoredGrossLimitCents("pa_snap_gross_hh8_2026", 9288_00, 10)).toBe(9288_00 + 948_00 * 2);
    expect(snapStoredGrossLimitCents("pa_snap_gross_hh4_2026", 5500_00, 4)).toBe(5500_00);
  });

  it("leaves a one-time lump sum out of SNAP income and recognizes a named gambling win", () => {
    expect(
      oneTimeOtherIncomeCents(
        [
          { date: "2026-06-02", amountCents: -20_00, userCategory: "other_income" },
          { date: "2026-06-04", amountCents: -2000_00, userCategory: "other_income" },
          { date: "2026-06-05", amountCents: -2000_00, userCategory: "earned_income" },
        ],
        "2026-06",
      ),
    ).toBe(2000_00);
    expect(isSubstantialGamblingWin([{ amountCents: 4750_00, name: "PA LOTTERY" }])).toBe(true);
    expect(isSubstantialGamblingWin([{ amountCents: 5000_00, name: "ACME PAYROLL" }])).toBe(false);
    expect(isSubstantialGamblingWin([{ amountCents: 4000_00, name: "LOTTERY" }])).toBe(false);
  });
});
