import type { BeneficiaryDoc } from "@/lib/db/models/Beneficiary";
import type { PrefillValues } from "@/lib/forms/types";

/** Today's date as YYYY-MM-DD (the value shape a <input type="date"> expects). */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dobIso(dob: Date | null | undefined): string {
  if (!dob) return "";
  return new Date(dob).toISOString().slice(0, 10);
}

/** Cents → a plain dollar string (e.g. 123456 → "1234.56") an <input> accepts. */
function dollars(cents: number | null | undefined): string {
  if (!cents || cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

/**
 * Build the prefill map a fillable form draws its defaults from, using the
 * primary beneficiary profile, the signed-in user's display info, and — where
 * available — figures derived from linked bank activity (monthly earned income,
 * current bank balance) so financial fields can auto-populate.
 */
export function buildPrefill(
  beneficiary: Pick<
    BeneficiaryDoc,
    "firstName" | "lastName" | "dateOfBirth" | "state" | "county" | "householdSize"
  > | null,
  preparer: { name?: string | null; email?: string | null },
  finances?: { monthlyEarnedIncomeCents?: number | null; bankBalanceCents?: number | null },
): PrefillValues {
  const first = beneficiary?.firstName?.trim() ?? "";
  const last = beneficiary?.lastName?.trim() ?? "";
  return {
    beneficiaryFullName: [first, last].filter(Boolean).join(" "),
    beneficiaryFirstName: first,
    beneficiaryLastName: last,
    dateOfBirth: dobIso(beneficiary?.dateOfBirth),
    state: beneficiary?.state?.trim() ?? "",
    county: beneficiary?.county?.trim() ?? "",
    householdSize: beneficiary?.householdSize ? String(beneficiary.householdSize) : "",
    monthlyEarnedIncome: dollars(finances?.monthlyEarnedIncomeCents),
    bankBalance: dollars(finances?.bankBalanceCents),
    preparerName: preparer.name?.trim() ?? "",
    preparerEmail: preparer.email?.trim() ?? "",
    today: todayIso(),
  };
}
