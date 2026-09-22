import { describe, expect, it } from "vitest";
import {
  isSubstantialGamblingWin,
  oneTimeOtherIncomeCents,
  snapGross130Cents,
  snapGross200Cents,
  snapStoredGrossLimitCents,
} from "./snap-limits";

describe("SNAP income limits (Oct 2025–Oct 2026)", () => {
  it("uses the Pennsylvania 200% table and $918 for each person after 8", () => {
    expect(snapGross200Cents(1)).toBe(2610_00);
    expect(snapGross200Cents(2)).toBe(3526_00);
    expect(snapGross200Cents(4)).toBe(5360_00);
    expect(snapGross200Cents(6)).toBe(7192_00);
    expect(snapGross200Cents(7)).toBe(8110_00);
    expect(snapGross200Cents(9)).toBe(9026_00 + 918_00);
  });

  it("uses the federal 130% table and fires only when income is over the line", () => {
    expect(snapGross130Cents(1)).toBe(1696_00);
    expect(snapGross130Cents(2)).toBe(2292_00);
    expect(snapGross130Cents(4)).toBe(3483_00);
    expect(snapGross130Cents(9)).toBe(5867_00 + 596_00);
  });

  it("adds $918 on the stored 8-person limit for larger households", () => {
    expect(snapStoredGrossLimitCents("pa_snap_gross_hh8_2026", 9026_00, 10)).toBe(9026_00 + 918_00 * 2);
    expect(snapStoredGrossLimitCents("pa_snap_gross_hh4_2026", 5360_00, 4)).toBe(5360_00);
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
