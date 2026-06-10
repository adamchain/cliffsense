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

  it("returns null without PFC primary", () => {
    expect(
      suggestUserCategoryFromPlaid({
        amountCents: -100,
        pfcPrimary: "",
        pfcDetailed: "",
      }),
    ).toBeNull();
  });
});
