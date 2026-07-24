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
  // Matchers calibrated against the real (decrypted) SSA-795 field tooltips.
  officialFill: {
    matchers: {
      name: ["name of person making statement", "name of wage earner"],
      ssn: ["social security number"],
      relationship: ["relationship to wage earner", "relationship"],
      statement: ["understanding that this statement", "i declare under penalty"],
      signedDate: ["date month day year", "date"],
      phone: ["telephone number"],
      address: ["address number and street", "mailing address"],
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
  // Matchers calibrated against the real (decrypted) SSA-821-BK field tooltips.
  officialFill: {
    matchers: {
      name: ["name of wage earner", "print your name", "claimant name", "your name"],
      ssn: ["b n c number or s s n", "s s n"],
      jobTitle: ["job title"],
      payRate: ["rate of pay amount", "rate of pay"],
      hoursPerWeek: ["average hours worked", "hours worked"],
      employerAddress: ["mailing address"],
      startDate: ["date work started", "work started"],
      endDate: ["date work ended", "work ended"],
      phone: ["telephone number"],
      remarks: ["please use this space", "tell us more about"],
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
  // Matchers calibrated against the real (decrypted) SSA-820-BK field tooltips.
  // The self-employment grid is highly structured, so we fill only the fields we
  // can map unambiguously; the user completes the rest.
  officialFill: {
    matchers: {
      ssn: ["b n c number or s s n", "s s n"],
      businessType: ["primary product or service"],
      netEarningsAnnual: ["yearly income"],
      phone: ["telephone number"],
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
  // The VA 21P-0969 splits every money value into separate digit/cents boxes
  // across repeating income rows, so reliable keyword auto-fill isn't feasible —
  // the bundled blank is offered for the user to complete directly.
  disclaimer: STATEMENT_DISCLAIMER,
};

/** SSA-827 — Authorization to Disclose Information to SSA. The HIPAA-compliant
 *  medical release SSA and state DDS use to pull records for a disability
 *  determination or continuing disability review. Mostly a consent form: we
 *  pre-fill the identity block; the user signs and dates the official PDF. */
const SSA_827: FillableFormDef = {
  id: "ssa-827",
  title: "Authorization to Disclose Information to SSA",
  agency: "Social Security Administration",
  purpose:
    "The HIPAA medical release that lets SSA and the state disability office (DDS) request your records. Usually signed first, so records can be gathered for a disability claim or continuing disability review. Good for 12 months.",
  officialUrl: "https://www.ssa.gov/forms/ssa-827.pdf",
  officialLabel: "Official SSA-827 (PDF)",
  sections: [
    {
      title: "Whose records are being disclosed",
      description: "Enter the person whose medical and other records SSA may request.",
      fields: [
        { name: "name", label: "Name (first, middle, last, suffix)", type: "text", required: true, prefill: "beneficiaryFullName", width: "half", question: "Whose records does this authorization cover? Enter their full name." },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Enter it on the official form you sign." },
        { name: "dob", label: "Date of birth", type: "date", prefill: "dateOfBirth", width: "half" },
      ],
    },
    {
      title: "Contact information",
      fields: [
        { name: "address", label: "Street address", type: "text", width: "full" },
        { name: "city", label: "City", type: "text", width: "half" },
        { name: "state", label: "State", type: "text", prefill: "state", width: "half" },
        { name: "zip", label: "ZIP code", type: "text", width: "half" },
        { name: "phone", label: "Phone number", type: "tel", width: "half" },
      ],
    },
    {
      title: "Signature",
      description:
        "The official SSA-827 needs a wet (ink) signature. If you are signing for someone else, tick the parent / guardian / representative box on the printed form and add the second signature if your state requires one.",
      fields: [
        { name: "dateSigned", label: "Date signed", type: "date", required: true, prefill: "today", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
  // Matchers calibrated against the real (decrypted) SSA-827 (06-2024) field tooltips.
  // Signer-type checkboxes are left for the user to tick on the signed copy.
  officialFill: {
    matchers: {
      name: ["name first middle last suffix", "whose records to be disclosed"],
      ssn: ["s s n"],
      dob: ["birthday"],
      address: ["street address"],
      city: ["city"],
      state: ["p1 state fld"],
      zip: ["zip"],
      phone: ["phone number with area code"],
      // Target the date field by internal name — the signature field's tooltip
      // also contains "date signed", so a plain keyword would fill the signature.
      dateSigned: ["p1 date1 fld"],
    },
  },
};

/** SSA-3373-BK — Function Report – Adult. The claimant's own account of how
 *  their condition limits daily activities, feeding SSA's RFC assessment. A long
 *  narrative form (10 pages); we guide the substantive answers, pre-fill the
 *  header, and auto-fill what maps cleanly. The user completes the checkbox
 *  grids (personal care, abilities, assistive devices) on the official PDF. */
const SSA_3373: FillableFormDef = {
  id: "ssa-3373",
  title: "Function Report — Adult",
  agency: "Social Security Administration",
  purpose:
    "Describe, in your own words, how your illnesses, injuries, or conditions limit your daily activities. Used at an initial disability claim, appeal, or review to judge your residual function. Keep answers consistent with your medical records.",
  officialUrl: "https://www.ssa.gov/forms/ssa-3373-bk.pdf",
  officialLabel: "Official SSA-3373-BK (PDF)",
  sections: [
    {
      title: "About you",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Enter it on the official form you file." },
        { name: "areaCode", label: "Phone area code", type: "text", width: "half" },
        { name: "phone", label: "Daytime phone number", type: "tel", width: "half" },
      ],
    },
    {
      title: "How your condition limits you",
      description: "Answer in your own words — be specific and concrete.",
      fields: [
        { name: "limitWork", label: "How do your conditions limit your ability to work?", type: "textarea", required: true, width: "full", question: "In your own words, how do your illnesses, injuries, or conditions limit your ability to work?" },
        { name: "typicalDay", label: "Describe a typical day, from waking up to going to bed", type: "textarea", width: "full", question: "Walk through a typical day — what you do from the time you wake up until you go to bed." },
        { name: "beforeVsNow", label: "What could you do before that you can't do now?", type: "textarea", width: "full", question: "What were you able to do before your conditions that you can't do now?" },
      ],
    },
    {
      title: "Daily activities",
      fields: [
        { name: "houseYardWork", label: "Household chores you can do (indoors & outdoors)", type: "textarea", width: "full" },
        { name: "gettingAround", label: "How often do you go outside?", type: "textarea", width: "half" },
        { name: "shoppingDescribe", label: "What do you shop for?", type: "textarea", width: "half" },
      ],
    },
    {
      title: "Abilities",
      fields: [
        { name: "walkDistance", label: "How far can you walk before needing to stop and rest?", type: "text", width: "half" },
        { name: "payAttention", label: "How long can you pay attention?", type: "text", width: "half" },
        { name: "followWritten", label: "How well do you follow written instructions?", type: "text", width: "half" },
        { name: "followSpoken", label: "How well do you follow spoken instructions?", type: "text", width: "half" },
        { name: "handleStress", label: "How well do you handle stress?", type: "text", width: "half" },
        { name: "handleChanges", label: "How well do you handle changes in routine?", type: "text", width: "half" },
      ],
    },
    {
      title: "Remarks & who completed this",
      fields: [
        { name: "remarks", label: "Remarks (anything else to add)", type: "textarea", width: "full" },
        { name: "preparerName", label: "Name of person completing this form", type: "text", prefill: "preparerName", width: "half" },
        { name: "signedDate", label: "Date", type: "date", required: true, prefill: "today", width: "half" },
        { name: "email", label: "Email address (optional)", type: "email", prefill: "preparerEmail", width: "half" },
        { name: "address", label: "Address (number and street)", type: "text", width: "full" },
        { name: "city", label: "City", type: "text", width: "half" },
        { name: "state", label: "State", type: "text", prefill: "state", width: "half" },
        { name: "zip", label: "ZIP code", type: "text", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
  // Matchers calibrated against the real (decrypted) SSA-3373-BK (02-2024) tooltips.
  // The two "Name" fields are disambiguated by internal field name (page 3 = the
  // claimant, page 10 = person completing the form).
  officialFill: {
    matchers: {
      name: ["bodypage3 0 name"],
      ssn: ["social security number"],
      areaCode: ["area code"],
      phone: ["bodypage3 0 phone"],
      limitWork: ["how do your illnesses injuries or conditions limit your ability to work"],
      typicalDay: ["describe what you do from the time you wake up"],
      beforeVsNow: ["what were you able to do before your illnesses"],
      houseYardWork: ["list household chores"],
      gettingAround: ["how often do you go outside"],
      shoppingDescribe: ["describe what you shop for"],
      walkDistance: ["how far can you walk before needing to stop"],
      payAttention: ["for how long can you pay attention"],
      followWritten: ["how well do you follow written instructions"],
      followSpoken: ["how well do you follow spoken instructions"],
      handleStress: ["how well do you handle stress"],
      handleChanges: ["how well do you handle changes in routine"],
      remarks: ["section e remarks"],
      preparerName: ["name of person completing this form"],
      signedDate: ["date mm dd yyyy"],
      email: ["email address optional"],
      address: ["address number and street"],
      city: ["bodypage10 0 city"],
      state: ["bodypage10 0 state"],
      zip: ["zip code"],
    },
  },
};

/** SSA-454-BK — Continuing Disability Review Report. The substantive form SSA
 *  uses at a CDR to decide whether someone still meets the disability standard.
 *  A 12-page form; we pre-fill the identity + contact blocks and point the user
 *  to the official PDF for the medical-provider, medication, and work-history
 *  tables. Best paired with a signed SSA-827 so SSA can pull the records. */
const SSA_454: FillableFormDef = {
  id: "ssa-454",
  title: "Continuing Disability Review Report",
  agency: "Social Security Administration",
  purpose:
    "The long-form report SSA uses at a Continuing Disability Review to decide whether you still meet the disability standard — your conditions, treatment, medications, and any work since the last decision. Pair it with a signed SSA-827.",
  officialUrl: "https://www.ssa.gov/forms/ssa-454-bk.pdf",
  officialLabel: "Official SSA-454-BK (PDF)",
  sections: [
    {
      title: "Section 1 — Information about you",
      fields: [
        { name: "name", label: "Name (first, middle, last)", type: "text", required: true, prefill: "beneficiaryFullName", width: "half" },
        { name: "ssn", label: "Social Security number", type: "text", placeholder: "###-##-####", width: "half", help: "Enter it on the official form you file." },
        { name: "mailingAddress", label: "Mailing address (street or PO box)", type: "text", width: "full" },
        { name: "city", label: "City", type: "text", width: "half" },
        { name: "state", label: "State", type: "text", prefill: "state", width: "half" },
        { name: "zip", label: "ZIP code", type: "text", width: "half" },
        { name: "phone", label: "Daytime phone number", type: "tel", width: "half" },
        { name: "email", label: "Email address", type: "email", width: "half" },
        { name: "heightFeet", label: "Height (feet)", type: "number", width: "half" },
        { name: "heightInches", label: "Height (inches)", type: "number", width: "half" },
        { name: "weightPounds", label: "Weight (pounds)", type: "number", width: "half" },
      ],
    },
    {
      title: "Section 2 — Someone we can contact",
      description: "Someone (other than your doctors) who knows about your conditions and can help SSA reach you.",
      fields: [
        { name: "contactName", label: "Contact's name", type: "text", width: "half" },
        { name: "contactRelationship", label: "Relationship to you", type: "text", width: "half" },
        { name: "contactPhone", label: "Contact's daytime phone", type: "tel", width: "half" },
      ],
    },
    {
      title: "Remarks",
      description:
        "List your medical conditions, treatment, medications, and any work since your last decision on the official PDF's tables. Use this space for anything that didn't fit — it maps to Section 9 (Remarks).",
      fields: [
        { name: "remarks", label: "Remarks / additional information", type: "textarea", width: "full" },
      ],
    },
    {
      title: "Section 10 — Who is completing this report",
      fields: [
        { name: "preparerName", label: "Name of person completing this report", type: "text", prefill: "preparerName", width: "half" },
        { name: "dateCompleted", label: "Date report completed", type: "date", required: true, prefill: "today", width: "half" },
      ],
    },
  ],
  disclaimer: STATEMENT_DISCLAIMER,
  // Matchers calibrated against the real (decrypted) SSA-454-BK (06-2023) tooltips.
  // City/State/ZIP repeat across sections, so those are matched by internal field
  // name to hit the Section 1 (about-you) block specifically.
  officialFill: {
    matchers: {
      name: ["1 ay name first"],
      ssn: ["1 b social security number"],
      mailingAddress: ["1 d mailing address"],
      city: ["n1ccity"],
      state: ["n1cstate"],
      zip: ["n1czip"],
      phone: ["1 f daytime phone"],
      email: ["1 g email"],
      heightFeet: ["height feet"],
      heightInches: ["n3binches"],
      weightPounds: ["weight pounds"],
      contactName: ["someone we can contact"],
      contactRelationship: ["2 b relationship"],
      contactPhone: ["2 d daytime phone"],
      // Section 9 remarks field, by internal name — the page-1 read-only intro
      // also mentions "Section 9 - Remarks".
      remarks: ["bodypage9 0 n7c"],
      preparerName: ["name first middle initial last"],
      dateCompleted: ["date report completed"],
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
  [SSA_827.id]: SSA_827,
  [SSA_3373.id]: SSA_3373,
  [SSA_454.id]: SSA_454,
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
