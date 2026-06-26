import type { FillableFormDef, FormFieldDef, PrefillValues } from "@/lib/forms/types";

/* ---------------------------------------------------------------------------
 * In-app fillable forms. Each is a field schema rendered by a generic form
 * component, pre-filled from the beneficiary profile, then printed or exported
 * to PDF. These reproduce / mirror official forms for convenience; the user is
 * always pointed at the official version for actual submission.
 * ------------------------------------------------------------------------- */

const STATEMENT_DISCLAIMER =
  "MyBenefitsPA is an informational tool and does not determine eligibility or submit forms on your behalf. Review everything for accuracy and file the official form with the agency. Knowingly giving false information on a benefits form may be a crime.";

/** SSA-795 — Statement of Claimant or Other Person. A general-purpose signed
 *  statement SSA accepts to report changes when no specific form exists. */
const SSA_795: FillableFormDef = {
  id: "ssa-795",
  title: "Statement of Claimant or Other Person",
  agency: "Social Security Administration",
  purpose:
    "Report a change (income, resources, living situation, work) to SSA in writing when no specific form applies — covers SSI and SSDI.",
  officialUrl: "https://www.ssa.gov/forms/ssa-795.pdf",
  officialLabel: "Official SSA-795 (PDF)",
  sections: [
    {
      title: "Who is making this statement",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Optional here — enter it on the official form you file." },
        { name: "relationship", label: "I am the…", type: "select", width: "half", options: [
          { value: "claimant", label: "Claimant / beneficiary" },
          { value: "representative", label: "Representative payee" },
          { value: "family", label: "Family member / caregiver" },
          { value: "other", label: "Other" },
        ] },
      ],
    },
    {
      title: "Your statement",
      description: "Describe what changed, when it changed, and any amounts. Be specific and factual.",
      fields: [
        { name: "statement", label: "Statement", type: "textarea", required: true, placeholder: "On [date], I started working at … earning $… per month. I am reporting this change in earned income.", help: "Write in your own words. Include dates and dollar amounts." },
      ],
    },
    {
      title: "Signature",
      fields: [
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half" },
        { name: "phone", label: "Daytime phone", type: "tel", width: "half" },
        { name: "address", label: "Mailing address", type: "textarea", width: "full" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
};

/** A universal income / household change worksheet. Not an official form — a
 *  MyBenefitsPA helper the user fills, prints, and uses to report changes to
 *  PA DHS (SNAP/TANF/Medicaid), SSA, Pennie, or a housing authority. */
const CHANGE_REPORT: FillableFormDef = {
  id: "change-report",
  title: "Income & Household Change Report",
  agency: "MyBenefitsPA (helper worksheet)",
  purpose:
    "A plain-language worksheet to organize a change before you report it to your agency. Pre-filled from your profile — fill the rest, print, and bring or attach it.",
  officialUrl: "https://www.pa.gov/agencies/dhs/resources/for-residents/semi-annual-reporting",
  officialLabel: "PA DHS — how to report changes",
  helper: true,
  sections: [
    {
      title: "Person this is about",
      fields: [
        { name: "beneficiaryName", label: "Full name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "dateOfBirth", label: "Date of birth", type: "date", prefill: "dateOfBirth", width: "half" },
        { name: "county", label: "County", type: "text", prefill: "county", width: "half" },
        { name: "state", label: "State", type: "text", prefill: "state", width: "half" },
        { name: "householdSize", label: "Household size", type: "number", prefill: "householdSize", width: "half" },
        { name: "caseNumber", label: "Case / record number (if known)", type: "text", width: "half" },
      ],
    },
    {
      title: "What changed",
      fields: [
        { name: "changeType", label: "Type of change", type: "select", required: true, width: "half", options: [
          { value: "income_up", label: "Income increased" },
          { value: "income_down", label: "Income decreased" },
          { value: "job_start", label: "Started a job" },
          { value: "job_end", label: "Lost / left a job" },
          { value: "household", label: "Household size changed" },
          { value: "address", label: "Address changed" },
          { value: "resources", label: "Resources / savings changed" },
          { value: "other", label: "Other" },
        ] },
        { name: "effectiveDate", label: "Date the change happened", type: "date", required: true, width: "half" },
        { name: "employer", label: "Employer / income source", type: "text", width: "half" },
        { name: "newMonthlyIncome", label: "New monthly amount", type: "currency", width: "half" },
        { name: "details", label: "Details", type: "textarea", required: true, width: "full", placeholder: "Describe the change. Include who, what, and exact amounts.", help: "Include dates and dollar amounts so the caseworker can act on it." },
      ],
    },
    {
      title: "Reporting to",
      fields: [
        { name: "agency", label: "Agency / program", type: "select", width: "half", options: [
          { value: "dhs", label: "PA DHS (SNAP / Cash / Medicaid)" },
          { value: "ssa", label: "Social Security (SSI / SSDI)" },
          { value: "pennie", label: "Pennie (ACA)" },
          { value: "housing", label: "Housing authority (Section 8)" },
          { value: "other", label: "Other" },
        ] },
        { name: "reportedDate", label: "Date you are reporting", type: "date", prefill: "today", width: "half" },
        { name: "preparedBy", label: "Prepared by", type: "text", prefill: "preparerName", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
};

/** SSA-821 — Work Activity Report (Employee). Reports wages and work activity
 *  from an employer; used in SGA determinations for SSI and SSDI. */
const SSA_821: FillableFormDef = {
  id: "ssa-821",
  title: "Work Activity Report — Employee",
  agency: "Social Security Administration",
  purpose:
    "Report wages and the details of work for an employer so SSA can evaluate substantial gainful activity (SSI and SSDI).",
  officialUrl: "https://www.ssa.gov/forms/ssa-821.pdf",
  officialLabel: "Official SSA-821 (PDF)",
  sections: [
    {
      title: "Identification",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Optional here — enter it on the official form you file." },
      ],
    },
    {
      title: "Employer",
      description: "List your most recent employer. If you had more than one, note the others under Remarks.",
      fields: [
        { name: "employerName", label: "Employer name", type: "text", required: true, width: "half" },
        { name: "jobTitle", label: "Job title / duties", type: "text", width: "half" },
        { name: "employerAddress", label: "Employer address", type: "textarea", width: "full" },
        { name: "startDate", label: "Date work started", type: "date", width: "half" },
        { name: "endDate", label: "Date work ended (if applicable)", type: "date", width: "half" },
        { name: "hoursPerWeek", label: "Hours per week", type: "number", width: "half" },
        { name: "payRate", label: "Rate of pay", type: "currency", width: "half", help: "Per hour, or note the period under Remarks." },
        { name: "grossMonthly", label: "Gross monthly earnings", type: "currency", width: "half" },
      ],
    },
    {
      title: "Work conditions & expenses",
      fields: [
        { name: "specialConditions", label: "Special conditions or extra help", type: "textarea", width: "full", help: "Did you get extra help, work fewer hours, or have duties changed because of your condition? Describe it." },
        { name: "irweDescription", label: "Impairment-related work expenses (IRWE)", type: "textarea", width: "half", help: "Things you pay for to be able to work (e.g. medication, transport, devices)." },
        { name: "irweMonthly", label: "IRWE monthly amount", type: "currency", width: "half" },
      ],
    },
    {
      title: "Remarks & signature",
      fields: [
        { name: "remarks", label: "Remarks", type: "textarea", width: "full" },
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half" },
        { name: "phone", label: "Daytime phone", type: "tel", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
};

/** PA 564 (SAR) — Semi-Annual Reporting form for SNAP / Cash Assistance. */
const PA_564_SAR: FillableFormDef = {
  id: "pa-564-sar",
  title: "Semi-Annual Report (SAR)",
  agency: "PA Department of Human Services",
  purpose:
    "Your six-month report of income, household, and expense changes that keeps SNAP and Cash Assistance correct.",
  officialUrl: "https://www.pa.gov/agencies/dhs/resources/for-residents/semi-annual-reporting",
  officialLabel: "PA DHS — Semi-Annual Reporting",
  helper: true,
  sections: [
    {
      title: "Household",
      fields: [
        { name: "name", label: "Head of household", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "caseNumber", label: "Record / case number", type: "text", width: "half" },
        { name: "county", label: "County", type: "text", prefill: "county", width: "half" },
        { name: "householdSize", label: "People in household", type: "number", prefill: "householdSize", width: "half" },
      ],
    },
    {
      title: "Income",
      description: "Report current income for everyone in the household. Note additional people under Other changes.",
      fields: [
        { name: "memberName", label: "Person with income", type: "text", width: "half" },
        { name: "incomeSource", label: "Source / employer", type: "text", width: "half" },
        { name: "grossMonthly", label: "Gross monthly income", type: "currency", width: "half" },
        { name: "incomeChanged", label: "Did income change since last report?", type: "select", width: "half", options: [
          { value: "no", label: "No change" },
          { value: "increased", label: "Increased" },
          { value: "decreased", label: "Decreased" },
          { value: "ended", label: "Ended" },
        ] },
      ],
    },
    {
      title: "Expenses (if changed)",
      fields: [
        { name: "rent", label: "Rent / mortgage (monthly)", type: "currency", width: "half" },
        { name: "utilities", label: "Utilities (monthly)", type: "currency", width: "half" },
        { name: "dependentCare", label: "Dependent / child care (monthly)", type: "currency", width: "half" },
        { name: "medical", label: "Medical expenses (monthly)", type: "currency", width: "half" },
      ],
    },
    {
      title: "Other changes & signature",
      fields: [
        { name: "otherChanges", label: "Household / address / other changes", type: "textarea", width: "full" },
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
};

/** VA 21P-0969 — Income and Asset Statement for needs-based pension / DIC. */
const VA_21P_0969: FillableFormDef = {
  id: "va-21p-0969",
  title: "Income and Asset Statement",
  agency: "U.S. Dept. of Veterans Affairs",
  purpose:
    "Report or update income, assets, and net worth in support of a needs-based VA pension or Parents' DIC claim.",
  officialUrl: "https://www.vba.va.gov/pubs/forms/VBA-21P-0969-ARE.pdf",
  officialLabel: "Official VA 21P-0969 (PDF)",
  sections: [
    {
      title: "Claimant",
      fields: [
        { name: "name", label: "Veteran / claimant name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "fileNumber", label: "VA file number / SSN", type: "text", width: "half", help: "Enter on the official form you file." },
      ],
    },
    {
      title: "Monthly income",
      description: "Gross monthly amount from each source for you (and your dependents).",
      fields: [
        { name: "socialSecurity", label: "Social Security", type: "currency", width: "half" },
        { name: "otherPensions", label: "Other pensions / retirement", type: "currency", width: "half" },
        { name: "wages", label: "Wages / earnings", type: "currency", width: "half" },
        { name: "interestDividends", label: "Interest / dividends", type: "currency", width: "half" },
        { name: "otherIncome", label: "Other income (describe)", type: "textarea", width: "full" },
      ],
    },
    {
      title: "Assets / net worth",
      fields: [
        { name: "bankAccounts", label: "Cash & bank accounts", type: "currency", width: "half" },
        { name: "investments", label: "Investments (stocks, bonds, funds)", type: "currency", width: "half" },
        { name: "realProperty", label: "Real property (excluding your home)", type: "currency", width: "half" },
        { name: "otherAssets", label: "Other assets (describe)", type: "textarea", width: "full" },
      ],
    },
    {
      title: "Certification",
      fields: [
        { name: "expectedChanges", label: "Expected income changes", type: "textarea", width: "full" },
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
};

export const FILLABLE_FORMS: Record<string, FillableFormDef> = {
  [SSA_795.id]: SSA_795,
  [CHANGE_REPORT.id]: CHANGE_REPORT,
  [SSA_821.id]: SSA_821,
  [PA_564_SAR.id]: PA_564_SAR,
  [VA_21P_0969.id]: VA_21P_0969,
};

export function getFillableForm(id: string): FillableFormDef | null {
  return FILLABLE_FORMS[id] ?? null;
}

/** Resolve a field's initial value from prefill data (empty string if none). */
export function defaultValueForField(field: FormFieldDef, prefill: PrefillValues): string {
  if (field.prefill && prefill[field.prefill]) return prefill[field.prefill] as string;
  return "";
}

/** Build the initial values map for every field in a form. */
export function initialValues(form: FillableFormDef, prefill: PrefillValues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const section of form.sections) {
    for (const field of section.fields) {
      out[field.name] = defaultValueForField(field, prefill);
    }
  }
  return out;
}
