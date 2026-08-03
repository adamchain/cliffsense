/**
 * Maps Plaid Personal Finance Categories (+ amount direction + payor text)
 * to MyBenefitsPA `userCategory` values used for limits and reporting.
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
  /** Plaid / bank description — used to catch payroll mis-tagged as TRANSFER_IN. */
  name?: string | null;
  merchantName?: string | null;
  /** Bank CSV category or Plaid legacy category string. */
  category?: string | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

function payorBlob(args: SuggestArgs): string {
  return `${args.name ?? ""} ${args.merchantName ?? ""} ${args.category ?? ""}`.trim();
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

/** Payroll processors / wage descriptors often miscategorized as account transfers. */
const PAYROLL_HINT =
  /\b(payroll|pay\s*roll|paycheck|pay\s*check|salary|wages?|earning|employer|direct\s*dep(?:osit)?|dir\.?\s*dep(?:osit)?|dirdep|net\s*pay|bi-?weekly\s*pay|semi-?monthly\s*pay|paychex|adp|gusto|workday|paycom|paylocity|ceridian|ukg|zenefits|rippling|square\s*payroll|intuit\s*payroll|quickbooks\s*payroll|ach\s*(?:credit|dep(?:osit)?|payroll)|ccd\s*(?:credit|deposit)|corp\s*pay)\b/i;

const BENEFIT_HINT =
  /\b(social\s*security|ssi|ssdi|supplemental\s*security|disability|unemployment|pension|va\s*benefit|child\s*support|alimony|snap\s*deposit|ebt)\b/i;

export function looksLikePayrollPayor(args: SuggestArgs | string | null | undefined, merchantName?: string | null): boolean {
  // Back-compat: looksLikePayrollPayor(name, merchantName)
  if (typeof args === "string" || args == null) {
    const blob = `${args ?? ""} ${merchantName ?? ""}`.trim();
    return Boolean(blob) && PAYROLL_HINT.test(blob);
  }
  const blob = payorBlob(args);
  return Boolean(blob) && PAYROLL_HINT.test(blob);
}

export function looksLikeBenefitPayor(args: SuggestArgs): boolean {
  const blob = payorBlob(args);
  return Boolean(blob) && BENEFIT_HINT.test(blob);
}

/**
 * Returns a suggested MyBenefitsPA category, or `null` when we should leave the row as `unclear`
 * for manual review.
 */
export function suggestUserCategoryFromPlaid(args: SuggestArgs): CliffUserCategory | null {
  const prim = norm(args.pfcPrimary);
  const det = norm(args.pfcDetailed);
  const inflow = args.amountCents < 0;
  const outflow = args.amountCents > 0;
  const payrollText = looksLikePayrollPayor(args);
  const benefitText = looksLikeBenefitPayor(args);

  // Text beats PFC: payroll ACH often lands as TRANSFER_IN; bank CSVs have no PFC.
  if (inflow && payrollText) {
    return "earned_income";
  }
  if (inflow && benefitText) {
    return "benefit_deposit";
  }

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
