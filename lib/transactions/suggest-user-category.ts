/**
 * Maps Plaid Personal Finance Categories (+ amount direction) to CliffSense
 * `userCategory` values used for limits and reporting.
 *
 * @see https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
 */

export type CliffUserCategory =
  | "earned_income"
  | "benefit_deposit"
  | "other_income"
  | "expense"
  | "transfer"
  | "unclear";

export type SuggestArgs = {
  amountCents: number;
  pfcPrimary?: string | null;
  pfcDetailed?: string | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

const EXPENSE_PRIMARIES = new Set([
  "FOOD_AND_DRINK",
  "GENERAL_MERCHANDISE",
  "ENTERTAINMENT",
  "TRANSPORTATION",
  "TRAVEL",
  "RENT_AND_UTILITIES",
  "HOME_IMPROVEMENT",
  "MEDICAL",
  "PERSONAL_CARE",
  "GENERAL_SERVICES",
  "BANK_FEES",
  "LOAN_PAYMENTS",
  "RECREATION",
  "EDUCATION",
  "LEGAL",
]);

/**
 * Returns a suggested CliffSense category, or `null` when we should leave the row as `unclear`
 * for manual review.
 */
export function suggestUserCategoryFromPlaid(args: SuggestArgs): CliffUserCategory | null {
  const prim = norm(args.pfcPrimary);
  const det = norm(args.pfcDetailed);
  const inflow = args.amountCents < 0;
  const outflow = args.amountCents > 0;

  if (!prim) {
    return null;
  }

  if (prim === "TRANSFER_IN" || prim === "TRANSFER_OUT" || prim.startsWith("TRANSFER_")) {
    return "transfer";
  }

  if (prim === "INCOME") {
    if (!inflow) {
      return null;
    }
    if (
      det.includes("WAGE") ||
      det.includes("SALARY") ||
      det.includes("COMMISSION") ||
      det.includes("BONUS") ||
      det === "INCOME"
    ) {
      return "earned_income";
    }
    if (
      det.includes("UNEMPLOYMENT") ||
      det.includes("RETIREMENT_PENSION") ||
      det.includes("SOCIAL_SECURITY") ||
      det.includes("DISABILITY") ||
      det.includes("CHILD_SUPPORT") ||
      det.includes("ALIMONY")
    ) {
      return "benefit_deposit";
    }
    if (det.includes("INTEREST") || det.includes("DIVIDEND") || det.includes("TAX_REFUND")) {
      return "other_income";
    }
    return "other_income";
  }

  if (prim === "GOVERNMENT_AND_NON_PROFIT") {
    if (inflow) {
      if (
        det.includes("DISABILITY") ||
        det.includes("SOCIAL_SECURITY") ||
        det.includes("UNEMPLOYMENT") ||
        det.includes("TAX_REFUND") ||
        det.includes("BENEFIT")
      ) {
        return "benefit_deposit";
      }
      return "other_income";
    }
    if (outflow) {
      return "expense";
    }
    return null;
  }

  if (EXPENSE_PRIMARIES.has(prim) && outflow) {
    return "expense";
  }

  if (outflow && (prim === "INCOME" || prim.startsWith("INCOME_"))) {
    return "transfer";
  }

  return null;
}
