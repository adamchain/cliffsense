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

/**
 * Build the prefill map a fillable form draws its defaults from, using the
 * primary beneficiary profile and the signed-in user's display info.
 */
export function buildPrefill(
  beneficiary: Pick<
    BeneficiaryDoc,
    "firstName" | "lastName" | "dateOfBirth" | "state" | "county" | "householdSize"
  > | null,
  preparer: { name?: string | null; email?: string | null },
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
    preparerName: preparer.name?.trim() ?? "",
    preparerEmail: preparer.email?.trim() ?? "",
    today: todayIso(),
  };
}
