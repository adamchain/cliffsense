import { describe, expect, it } from "vitest";
import {
  ableAccountBalanceCents,
  countableResourceBalanceCents,
  grossMonthlyIncomeCents,
  grossUpEarnedCents,
  monthlyIncomeBreakdownCents,
  ssiCountableMonthlyIncomeCents,
  type TxLike,
} from "@/lib/thresholds/metrics";

const tx = (date: string, amountCents: number, userCategory: string, extra?: Partial<TxLike>): TxLike => ({
  date,
  amountCents,
  userCategory,
  pending: false,
  ...extra,
});

describe("grossUpEarnedCents", () => {
  it("applies the PA gross-up to net wages", () => {
    expect(grossUpEarnedCents(66260)).toBe(74874); // $662.60 net → ~$748.74 gross
  });
  it("never goes negative", () => {
    expect(grossUpEarnedCents(-500)).toBe(0);
  });
});

describe("monthlyIncomeBreakdownCents", () => {
  const rows: TxLike[] = [
    tx("2026-06-03", -66260, "earned_income"), // wages (inflow = negative)
    tx("2026-06-10", -120000, "benefit_deposit"), // SSDI
    tx("2026-06-12", -1500, "other_income"), // interest
    tx("2026-06-15", -50000, "transfer"), // ignored
    tx("2026-06-16", 4000, "expense"), // outflow, ignored
    tx("2026-06-20", -9999, "earned_income", { excludedFromThresholds: true }), // excluded
    tx("2026-06-22", -9999, "earned_income", { pending: true }), // pending
    tx("2026-05-30", -9999, "earned_income"), // wrong month
  ];
  it("sums inflows by category, ignoring transfers/expenses/excluded/pending/other months", () => {
    const b = monthlyIncomeBreakdownCents(rows, "2026-06");
    expect(b.earnedNetCents).toBe(66260);
    expect(b.benefitCents).toBe(120000);
    expect(b.otherCents).toBe(1500);
    expect(b.earnedGrossCents).toBe(74874);
  });
});

describe("income aggregations", () => {
  const b = { earnedNetCents: 66260, earnedGrossCents: 74874, benefitCents: 0, otherCents: 0 };
  it("gross income is the sum of grossed-up earned + benefit + other (SNAP test)", () => {
    expect(grossMonthlyIncomeCents(b)).toBe(74874);
  });
  it("SSI countable income applies $20 + $65 + half disregards on earned only", () => {
    // ($748.74 − $0.65? no: cents) earnedGross 74874 − 6500 − 2000 = 66374; /2 = 33187
    expect(ssiCountableMonthlyIncomeCents(b)).toBe(33187);
  });
  it("applies the $20 general exclusion to unearned first", () => {
    const withUnearned = { earnedNetCents: 0, earnedGrossCents: 0, benefitCents: 120000, otherCents: 0 };
    expect(ssiCountableMonthlyIncomeCents(withUnearned)).toBe(118000); // 120000 − 2000
  });
  it("can leave an SSI payment out and apply the student exclusion", () => {
    const withSsi = { earnedNetCents: 0, earnedGrossCents: 800_00, benefitCents: 994_00, otherCents: 0 };
    expect(
      ssiCountableMonthlyIncomeCents(withSsi, { excludeUnearnedCents: 994_00, studentExclusionCents: 800_00 }),
    ).toBe(0);
  });
  it("subtracts IRWE after $65 and before the one-half, and does not reduce unearned income", () => {
    const wages = { earnedNetCents: 1000_00, earnedGrossCents: 1000_00, benefitCents: 0, otherCents: 0 };
    // $1,000 − $20 − $65 − $100 IRWE = $815; half is $407.50
    expect(ssiCountableMonthlyIncomeCents(wages, { irweCents: 100_00 })).toBe(407_50);
    const withUnearned = { earnedNetCents: 0, earnedGrossCents: 100_00, benefitCents: 500_00, otherCents: 0 };
    // Unearned already uses the $20. Earned $100 − $65 = $35, IRWE uses that up.
    expect(ssiCountableMonthlyIncomeCents(withUnearned, { irweCents: 80_00 })).toBe(480_00);
  });
});

describe("noncountable deposits", () => {
  it("leaves SNAP and ABLE distributions out of income, and keeps a paycheck", () => {
    const rows: TxLike[] = [
      tx("2026-06-03", -200_00, "benefit_deposit", { name: "PA SNAP EBT" }),
      tx("2026-06-04", -150_00, "other_income", { merchantName: "PA ABLE" }),
      tx("2026-06-05", -400_00, "earned_income", { name: "ABLE STAFFING PAYROLL" }),
    ];
    const b = monthlyIncomeBreakdownCents(rows, "2026-06");
    expect(b.benefitCents).toBe(0);
    expect(b.otherCents).toBe(0);
    expect(b.earnedNetCents).toBe(400_00);
  });
});

describe("countable resources", () => {
  it("adds accounts together and leaves out credit, ABLE, and special-needs-trust balances", () => {
    expect(
      countableResourceBalanceCents([
        { type: "depository", name: "Checking", currentBalanceCents: 1500_00 },
        { type: "depository", name: "Savings", currentBalanceCents: 1500_00 },
        { type: "depository", name: "PA ABLE", currentBalanceCents: 40_000_00 },
        { type: "depository", name: "SNT", currentBalanceCents: 8_000_00 },
        { type: "credit", name: "Card", currentBalanceCents: 900_00 },
      ]),
    ).toBe(3000_00);
    expect(
      ableAccountBalanceCents([
        { type: "depository", name: "Checking", currentBalanceCents: 1500_00 },
        { type: "depository", name: "PA ABLE", currentBalanceCents: 40_000_00 },
      ]),
    ).toBe(40_000_00);
  });
});
