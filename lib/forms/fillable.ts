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
  officialFill: {
    matchers: {
      name: ["name of claimant", "claimant", "your name", "print name", "name"],
      ssn: ["social security number", "ssn", "social security"],
      statement: ["statement", "the following", "remarks", "i want to state"],
      signedDate: ["date signed", "date of signature", "date"],
      phone: ["telephone number", "daytime telephone", "phone"],
      address: ["mailing address", "address", "street address"],
    },
  },
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
  officialFill: {
    matchers: {
      name: ["name of wage earner", "wage earner", "claimant name", "your name", "name"],
      ssn: ["social security number", "ssn", "social security"],
      employerName: ["name of employer", "employer name", "employer", "company name"],
      jobTitle: ["type of work", "kind of work", "job title", "occupation", "duties", "your job"],
      employerAddress: ["employer address", "address of employer", "employer mailing", "address"],
      startDate: ["date you started", "date work began", "began working", "start date", "date started"],
      endDate: ["date you stopped", "date work ended", "stopped working", "last day", "date stopped"],
      hoursPerWeek: ["hours per week", "hours a week", "hours each week", "number of hours"],
      payRate: ["rate of pay", "pay rate", "hourly rate", "rate of earnings"],
      grossMonthly: ["gross monthly", "monthly earnings", "amount earned", "gross earnings", "gross amount"],
      specialConditions: ["special conditions", "extra help", "subsidy", "special arrangements"],
      irweDescription: ["impairment related work expenses", "work expenses related", "irwe"],
      irweMonthly: ["amount you pay", "expense amount", "monthly expense"],
      remarks: ["remarks", "additional information", "explain", "comments"],
      signedDate: ["date signed", "today date", "date of signature", "date"],
      phone: ["telephone number", "daytime telephone", "phone number", "telephone"],
    },
  },
};

/** SSA-820 — Work Activity Report (Self-Employment). Reports self-employment
 *  work and net earnings so SSA can evaluate substantial gainful activity. */
const SSA_820: FillableFormDef = {
  id: "ssa-820",
  title: "Work Activity Report — Self-Employment",
  agency: "Social Security Administration",
  purpose:
    "Report self-employment work, the services you provide, and your net earnings so SSA can evaluate substantial gainful activity (SSI and SSDI).",
  officialUrl: "https://www.ssa.gov/forms/ssa-820.pdf",
  officialLabel: "Official SSA-820 (PDF)",
  sections: [
    {
      title: "Identification",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half", question: "First, what's the name this report is for?" },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Optional here — enter it on the official form you file.", question: "What's your Social Security number? (You can skip this and add it on the official form.)" },
        { name: "claimType", label: "This is for", type: "select", width: "half", question: "Which benefit is this about?", options: [
          { value: "ssi", label: "SSI" },
          { value: "ssdi", label: "SSDI" },
          { value: "both", label: "Both SSI and SSDI" },
        ] },
      ],
    },
    {
      title: "Your business",
      description: "Tell us about the business or self-employment you do.",
      fields: [
        { name: "businessName", label: "Business name", type: "text", width: "half", question: "What's the name of your business? (If it has no formal name, describe it — e.g. \"house cleaning\".)" },
        { name: "businessType", label: "Type of business / trade", type: "text", width: "half", question: "What kind of work is it? (For example: rideshare driving, lawn care, online sales, consulting.)" },
        { name: "ownership", label: "Your role in the business", type: "select", width: "half", question: "How are you involved in the business?", options: [
          { value: "sole", label: "Sole owner" },
          { value: "partner", label: "Partner" },
          { value: "officer", label: "Corporate officer" },
          { value: "other", label: "Other" },
        ] },
        { name: "startDate", label: "Date the business started", type: "date", width: "half", question: "When did you start this self-employment?" },
        { name: "stillOperating", label: "Are you still working in the business?", type: "checkbox", width: "half", question: "Are you still working in the business today?" },
        { name: "endDate", label: "Date you stopped (if applicable)", type: "date", width: "half", question: "If you've stopped, what date did you stop? (Skip if you're still working.)" },
        { name: "hoursPerMonth", label: "Hours you work per month", type: "number", width: "half", question: "About how many hours a month do you put into the business?" },
        { name: "duties", label: "What you do in the business", type: "textarea", width: "full", question: "In your own words, what do you do day to day in the business?", help: "List the tasks you handle — e.g. driving, bookkeeping, managing staff, selling." },
      ],
    },
    {
      title: "Services & earnings",
      description: "These help SSA judge whether your work counts as substantial.",
      fields: [
        { name: "significantServices", label: "Do you provide significant services?", type: "checkbox", width: "full", question: "Do you provide significant services to the business — more than 45 hours a month, or more than half of what it takes to run it?", help: "If you manage the business or it couldn't run without you, this is usually Yes." },
        { name: "netEarningsMonthly", label: "Net earnings from self-employment (monthly)", type: "currency", width: "half", prefill: "monthlyEarnedIncome", question: "Roughly what are your net monthly earnings (after business expenses)?", help: "We've estimated this from your recent deposits — adjust it to your actual net." },
        { name: "netEarningsAnnual", label: "Net earnings from self-employment (annual)", type: "currency", width: "half", question: "And about how much do you net per year?" },
        { name: "tookSalary", label: "Do you draw a salary or owner's pay?", type: "checkbox", width: "half", question: "Do you pay yourself a salary or regular draw from the business?" },
        { name: "salaryMonthly", label: "Monthly salary / draw", type: "currency", width: "half", question: "If so, how much per month? (Skip if you don't.)" },
      ],
    },
    {
      title: "Changes, help & expenses",
      description: "Anything that lowers what your work is really worth to you.",
      fields: [
        { name: "workChanges", label: "Changes in your work activity", type: "textarea", width: "full", question: "Have your hours, duties, or earnings changed at any point? Describe when and how.", help: "Note any periods you worked more or less, or earned more or less." },
        { name: "unincurredExpenses", label: "Business expenses paid by someone else", type: "textarea", width: "full", question: "Does anyone else pay for things your business uses — like equipment from Vocational Rehab or an SBA grant?", help: "These \"unincurred\" expenses can be subtracted when SSA values your work." },
        { name: "unpaidHelp", label: "Unpaid help from others", type: "textarea", width: "full", question: "Does anyone help with the business for free (family, friends)? Roughly what would that help cost to hire?" },
        { name: "irweDescription", label: "Impairment-related work expenses (IRWE)", type: "textarea", width: "half", question: "Do you pay out of pocket for things you need in order to work — medication, transport, special equipment?" },
        { name: "irweMonthly", label: "IRWE monthly amount", type: "currency", width: "half", question: "About how much do those work-related expenses cost you each month?" },
      ],
    },
    {
      title: "Remarks & signature",
      fields: [
        { name: "remarks", label: "Anything else to add", type: "textarea", width: "full", question: "Anything else SSA should know? Add it here." },
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half", question: "What's today's date?" },
        { name: "phone", label: "Daytime phone", type: "tel", width: "half", question: "Lastly, what's a daytime phone number SSA can reach you at?" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
  officialFill: {
    matchers: {
      name: ["name of wage earner", "wage earner", "claimant name", "your name", "name"],
      ssn: ["social security number", "ssn", "social security"],
      businessName: ["name of business", "business name", "trade name"],
      businessType: ["type of business", "kind of business", "nature of business", "trade"],
      startDate: ["date business started", "date you started", "began", "start date"],
      endDate: ["date you stopped", "date business ended", "stopped", "last day"],
      hoursPerMonth: ["hours per month", "hours a month", "number of hours"],
      duties: ["duties", "services you perform", "what you do", "describe your work"],
      netEarningsMonthly: ["net earnings", "monthly net", "net monthly", "net profit"],
      netEarningsAnnual: ["annual net", "yearly net", "net earnings year"],
      salaryMonthly: ["salary", "owner draw", "amount you draw", "monthly salary"],
      workChanges: ["changes in work", "change in your work", "work activity changed"],
      unincurredExpenses: ["unincurred", "paid by someone else", "business expenses paid"],
      unpaidHelp: ["unpaid help", "help from others", "assistance from others"],
      irweDescription: ["impairment related work expenses", "work expenses related", "irwe"],
      irweMonthly: ["amount you pay", "expense amount", "monthly expense"],
      remarks: ["remarks", "additional information", "explain", "comments"],
      signedDate: ["date signed", "date of signature", "date"],
      phone: ["telephone number", "daytime telephone", "phone"],
    },
  },
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
  officialFill: {
    matchers: {
      name: ["name of veteran", "veteran name", "claimant name", "your name", "name"],
      fileNumber: ["va file number", "file number", "social security number", "claim number"],
      socialSecurity: ["social security benefit", "social security income", "amount of social security"],
      otherPensions: ["pension", "retirement", "annuity"],
      wages: ["wages", "earnings", "gross wages", "employment income"],
      interestDividends: ["interest", "dividends", "interest and dividends"],
      otherIncome: ["other income", "additional income"],
      bankAccounts: ["cash", "bank account", "checking", "savings"],
      investments: ["stocks", "bonds", "investments", "mutual funds"],
      realProperty: ["real property", "real estate", "land", "property"],
      otherAssets: ["other assets", "additional assets"],
      expectedChanges: ["expected", "anticipated", "changes in income"],
      signedDate: ["date signed", "date of signature", "date"],
    },
  },
};

export const FILLABLE_FORMS: Record<string, FillableFormDef> = {
  [SSA_795.id]: SSA_795,
  [CHANGE_REPORT.id]: CHANGE_REPORT,
  [SSA_821.id]: SSA_821,
  [SSA_820.id]: SSA_820,
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
