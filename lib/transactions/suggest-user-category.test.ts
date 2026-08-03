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

  it("returns null without PFC primary when not payroll", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -100,
        pfcPrimary: "",
        pfcDetailed: "",
      }),
    ).toBeNull();
  });
});
