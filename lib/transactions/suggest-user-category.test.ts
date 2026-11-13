import { describe, expect, it } from "vitest";
import { suggestUserCategoryFromPlaid } from "./suggest-user-category";

describe("suggestUserCategoryFromPlaid", () => {
  it("maps wage income inflow to earned_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -50000,
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_WAGES",
      }),
    ).toBe("earned_income");
  });

  it("maps social-security-style inflow to benefit_deposit", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -120000,
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_RETIREMENT_PENSION",
      }),
    ).toBe("benefit_deposit");
  });

  it("maps generic income inflow to other_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -100,
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_OTHER_INCOME",
      }),
    ).toBe("other_income");
  });

  it("maps food outflow to expense", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: 4500,
        pfcPrimary: "FOOD_AND_DRINK",
        pfcDetailed: "FOOD_AND_DRINK_GROCERIES",
      }),
    ).toBe("expense");
  });

  it("maps transfers", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -20000,
        pfcPrimary: "TRANSFER_IN",
        pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
      }),
    ).toBe("transfer");
  });

  it("maps payroll-like TRANSFER_IN to earned_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -85000,
        pfcPrimary: "TRANSFER_IN",
        pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
        name: "ADP PAYROLL DIRECT DEP",
        merchantName: "ADP",
      }),
    ).toBe("earned_income");
  });

  it("maps payroll text without PFC to earned_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -40000,
        pfcPrimary: "",
        name: "GUSTO PAYROLL",
      }),
    ).toBe("earned_income");
  });

  it("maps CSV paycheck descriptions to earned_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -120000,
        pfcPrimary: "",
        name: "Paycheck",
      }),
    ).toBe("earned_income");
  });

  it("maps bank category Payroll to earned_income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -50000,
        pfcPrimary: "TRANSFER_IN",
        pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
        name: "ACME CORP",
        category: "Payroll",
      }),
    ).toBe("earned_income");
  });

  it("does not count a SNAP deposit or an ABLE distribution as income", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -200_00,
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_OTHER",
        name: "PA SNAP BENEFITS",
      }),
    ).toBe("transfer");
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -80_00,
        name: "PA ABLE DISTRIBUTION",
      }),
    ).toBe("transfer");
  });

  it("returns null without PFC primary when not payroll", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -100,
        pfcPrimary: "",
        pfcDetailed: "",
      }),
    ).toBeNull();
  });

  it("maps imported spending to expense without a Plaid category", () => {
    const samples = [
      { name: "CVS PHARMACY", category: "Pharmacy & Personal Care", amountCents: 1620 },
      { name: "McDonald's", category: "Restaurants", amountCents: 1365 },
      { name: "T-Mobile", category: "Phone", amountCents: 4800 },
      { name: "Giant Food Stores", category: "Groceries", amountCents: 5124 },
      { name: "ATM Withdrawal", category: "Cash Withdrawal", amountCents: 4000 },
      { name: "Rent Payment - Oakview Apartment", category: "Housing", amountCents: 62500 },
      { name: "SEPTA KEY AUTOLOAD", category: "Transportation", amountCents: 2500 },
      { name: "Comcast Internet", category: "Utilities", amountCents: 5999 },
      { name: "PECO ELECTRIC", category: "Utilities", amountCents: 7118 },
      { name: "Coffee", category: "", amountCents: 450 },
    ];
    for (const sample of samples) {
      expect(suggestUserCategoryFromPlaid({ ...sample, pfcPrimary: "" })).toBe("expense");
    }
  });

  it("keeps an imported transfer out of expenses", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: 20000,
        pfcPrimary: "",
        name: "Zelle to savings",
      }),
    ).toBe("transfer");
  });

  it("leaves a payroll reversal for review", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: 40000,
        pfcPrimary: "",
        name: "GUSTO PAYROLL REVERSAL",
      }),
    ).toBeNull();
  });
});
