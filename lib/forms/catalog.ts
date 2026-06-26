import type { Program } from "@/lib/programs";
import type { CatalogForm } from "@/lib/forms/types";

/* ---------------------------------------------------------------------------
 * Catalog of official reporting and reapply/recertification forms by program.
 * PA-administered programs (SNAP, Medicaid, TANF, WIC, LIHEAP, ACA→Pennie)
 * use Pennsylvania forms/portals; federal programs (SSI, SSDI, Section 8, VA,
 * ABLE) use the federal agency form. Links point to official sources only.
 *
 * NOTE: links were located via search of the official domains; this app's
 * build environment cannot fetch URLs, so they are not byte-verified. Agencies
 * occasionally re-issue forms — the listing pages are the safest fallback.
 * ------------------------------------------------------------------------- */

export const FORMS_CATALOG: CatalogForm[] = [
  // ----------------------------- SSI -----------------------------
  {
    id: "ssi-ssa-795", program: "SSI", category: "reporting", formNumber: "SSA-795",
    title: "Statement of Claimant or Other Person", agency: "Social Security Administration",
    purpose: "Report income, resource, or living-situation changes in writing.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/forms/ssa-795.pdf", fillableId: "ssa-795",
  },
  {
    id: "ssi-ssa-821", program: "SSI", category: "reporting", formNumber: "SSA-821",
    title: "Work Activity Report — Employee", agency: "Social Security Administration",
    purpose: "Report wages and work activity from an employer.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/forms/ssa-821.pdf",
  },
  {
    id: "ssi-ssa-820", program: "SSI", category: "reporting", formNumber: "SSA-820",
    title: "Work Activity Report — Self-Employment", agency: "Social Security Administration",
    purpose: "Report self-employment work and earnings.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/forms/ssa-820.pdf",
  },
  {
    id: "ssi-wage-reporting", program: "SSI", category: "reporting",
    title: "SSI monthly wage reporting (app / phone / online)", agency: "Social Security Administration",
    purpose: "Report monthly wages via SSA Mobile Wage Reporting, the phone line, or myWageReport.",
    frequency: "Monthly", officialUrl: "https://www.ssa.gov/ssi/reporting/wages", online: true,
  },
  {
    id: "ssi-ssa-8202", program: "SSI", category: "reapply", formNumber: "SSA-8202",
    title: "SSI Redetermination — Continuing Eligibility", agency: "Social Security Administration",
    purpose: "Periodic review of income, resources, and living arrangements for SSI.",
    frequency: "Periodic (1–6 yrs)",
    officialUrl: "https://www.ssa.gov/foia/resources/proactivedisclosure/2023/SSA-8202%20-%20Statement%20for%20Determining%20Continuing%20Eligibility%20for%20Supplemental%20Security%20Income%20Payment.pdf",
  },

  // ----------------------------- SSDI -----------------------------
  {
    id: "ssdi-ssa-821", program: "SSDI", category: "reporting", formNumber: "SSA-821",
    title: "Work Activity Report — Employee", agency: "Social Security Administration",
    purpose: "Report employee wages and work activity for SGA determinations.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/forms/ssa-821.pdf",
  },
  {
    id: "ssdi-ssa-820", program: "SSDI", category: "reporting", formNumber: "SSA-820",
    title: "Work Activity Report — Self-Employment", agency: "Social Security Administration",
    purpose: "Report self-employment work and earnings.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/forms/ssa-820.pdf",
  },
  {
    id: "ssdi-mywagereport", program: "SSDI", category: "reporting",
    title: "myWageReport (online wage reporting)", agency: "Social Security Administration",
    purpose: "Report wages online through your my Social Security account.",
    frequency: "As needed", officialUrl: "https://www.ssa.gov/myaccount/", online: true,
  },
  {
    id: "ssdi-ssa-454", program: "SSDI", category: "reapply", formNumber: "SSA-454-BK",
    title: "Continuing Disability Review Report", agency: "Social Security Administration",
    purpose: "Long-form medical review of your condition, treatment, and work since the last decision.",
    frequency: "Periodic", officialUrl: "https://www.ssa.gov/forms/ssa-454-bk.pdf",
  },
  {
    id: "ssdi-ssa-455", program: "SSDI", category: "reapply", formNumber: "SSA-455",
    title: "Disability Update Report", agency: "Social Security Administration",
    purpose: "Short mailed questionnaire that screens whether a full CDR is needed.",
    frequency: "Periodic", officialUrl: "https://www.ssa.gov/forms/ssa-455.pdf",
  },

  // ----------------------------- SNAP -----------------------------
  {
    id: "snap-pa564", program: "SNAP", category: "reporting", formNumber: "PA 564 (SAR)",
    title: "Semi-Annual Reporting form", agency: "PA Department of Human Services",
    purpose: "Six-month report of income, household, and residence changes.",
    frequency: "Every 6 months",
    officialUrl: "https://services.dpw.state.pa.us/oimpolicymanuals/snap/PA_564_(SAR)_(10-07).pdf",
    fillableId: "change-report",
  },
  {
    id: "snap-change", program: "SNAP", category: "reporting",
    title: "Report a change (COMPASS / phone)", agency: "PA Department of Human Services",
    purpose: "Report income or household changes online or by phone (due by the 10th of the next month).",
    frequency: "As needed", officialUrl: "https://www.pa.gov/agencies/dhs/resources/for-residents/semi-annual-reporting", online: true,
  },
  {
    id: "snap-pa600fs", program: "SNAP", category: "reapply", formNumber: "PA 600 FS",
    title: "Application for SNAP", agency: "PA Department of Human Services",
    purpose: "SNAP-only paper application — apply or reapply.",
    frequency: "At certification",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/PA%20600%20FS%20SG%20%E2%80%94%20SNAP.pdf",
  },
  {
    id: "snap-pa600r", program: "SNAP", category: "reapply", formNumber: "PA 600 R",
    title: "Benefits Review (renewal)", agency: "PA Department of Human Services",
    purpose: "Renewal / redetermination at the end of the certification period.",
    frequency: "At renewal",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/benefits-review-form-pa-600-r-as.pdf",
  },

  // ----------------------------- Medicaid -----------------------------
  {
    id: "ma-change", program: "Medicaid", category: "reporting",
    title: "Report a change (COMPASS / phone)", agency: "PA Department of Human Services",
    purpose: "Report income, household, or address changes for Medical Assistance.",
    frequency: "As needed", officialUrl: "https://www.compass.dhs.pa.gov/", online: true,
  },
  {
    id: "ma-pa600hc", program: "Medicaid", category: "reapply", formNumber: "PA 600 HC",
    title: "Application for Health Care Coverage", agency: "PA Department of Human Services",
    purpose: "Health-care-only Medical Assistance / CHIP application.",
    frequency: "At application",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/PA-600-HC-7-22_Final.pdf",
  },
  {
    id: "ma-pa600r", program: "Medicaid", category: "reapply", formNumber: "PA 600 R",
    title: "Benefits Review (annual renewal)", agency: "PA Department of Human Services",
    purpose: "Annual MA renewal/redetermination (the pink-envelope packet).",
    frequency: "Annual",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/benefits-review-form-pa-600-r-as.pdf",
  },
  {
    id: "ma-renew-online", program: "Medicaid", category: "reapply",
    title: "Renew online (COMPASS)", agency: "PA Department of Human Services",
    purpose: "Renew Medical Assistance online up to 60 days before it's due.",
    frequency: "Annual", officialUrl: "https://www.compass.state.pa.us/compass.web/AFS/RenewYourBenefits", online: true,
  },

  // ----------------------------- Section 8 -----------------------------
  {
    id: "s8-hud9886", program: "Section8", category: "reporting", formNumber: "HUD-9886",
    title: "Authorization for the Release of Information", agency: "U.S. HUD",
    purpose: "Authorize the housing authority to verify your income and eligibility.",
    frequency: "At each recert", officialUrl: "https://www.hud.gov/sites/dfiles/OCHCO/documents/9886.pdf",
  },
  {
    id: "s8-interim", program: "Section8", category: "reporting",
    title: "Interim recertification (report a change)", agency: "Local Public Housing Authority",
    purpose: "Report income/household changes between annual reviews — packet issued by your PHA.",
    frequency: "As needed", officialUrl: "https://www.hud.gov/helping-americans/public-indian-housing-systems-pic-50058-resources", online: true,
  },
  {
    id: "s8-hud50058", program: "Section8", category: "reapply", formNumber: "HUD-50058",
    title: "Family Report", agency: "U.S. HUD",
    purpose: "The household/income/rent record the PHA submits at annual recertification.",
    frequency: "Annual", officialUrl: "https://www.hud.gov/sites/dfiles/OCHCO/documents/50058.PDF",
  },

  // ----------------------------- TANF -----------------------------
  {
    id: "tanf-pa564", program: "TANF", category: "reporting", formNumber: "PA 564 (SAR)",
    title: "Semi-Annual Reporting form", agency: "PA Department of Human Services",
    purpose: "Six-month report of income/household changes for Cash Assistance.",
    frequency: "Every 6 months",
    officialUrl: "https://services.dpw.state.pa.us/oimpolicymanuals/snap/PA_564_(SAR)_(10-07).pdf",
    fillableId: "change-report",
  },
  {
    id: "tanf-pa600", program: "TANF", category: "reapply", formNumber: "PA 600",
    title: "Application for Benefits", agency: "PA Department of Human Services",
    purpose: "Combined application that includes Cash Assistance / TANF.",
    frequency: "At application",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/pa-0600.pdf",
  },
  {
    id: "tanf-pa600r", program: "TANF", category: "reapply", formNumber: "PA 600 R",
    title: "Benefits Review (renewal)", agency: "PA Department of Human Services",
    purpose: "Renewal / redetermination for Cash Assistance.",
    frequency: "At renewal",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/benefits-applications/benefits-review-form-pa-600-r-as.pdf",
  },

  // ----------------------------- WIC -----------------------------
  {
    id: "wic-preapp", program: "WIC", category: "reapply",
    title: "WIC online pre-application", agency: "PA WIC (Dept. of Health)",
    purpose: "Submit your info to be contacted; certification happens in person at a clinic.",
    frequency: "At certification", officialUrl: "https://www.pawic.com/OnlineApplication.aspx", online: true,
  },
  {
    id: "wic-recert", program: "WIC", category: "reapply",
    title: "WIC recertification (in person)", agency: "PA WIC (Dept. of Health)",
    purpose: "Recertify at your local clinic when the certification period ends.",
    frequency: "Every 6–12 months", officialUrl: "https://www.pawic.com/ParticipantForms.aspx", online: true,
  },

  // ----------------------------- LIHEAP -----------------------------
  {
    id: "liheap-hsea1", program: "LIHEAP", category: "reapply", formNumber: "HSEA-1",
    title: "LIHEAP Application", agency: "PA Department of Human Services",
    purpose: "Apply each heating season for cash and crisis energy assistance.",
    frequency: "Each season",
    officialUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/services/assistance/documents/heating-assistance_liheap/hsea-0001.pdf",
  },
  {
    id: "liheap-compass", program: "LIHEAP", category: "reapply",
    title: "Apply online (COMPASS)", agency: "PA Department of Human Services",
    purpose: "Apply for LIHEAP online during the open season.",
    frequency: "Each season", officialUrl: "https://www.compass.state.pa.us/", online: true,
  },

  // ----------------------------- ACA / Pennie -----------------------------
  {
    id: "aca-report-change", program: "ACA", category: "reporting",
    title: "Report a change (Pennie account)", agency: "Pennie (PA exchange)",
    purpose: "Update income/household within 30 days so your tax credit stays correct.",
    frequency: "Within 30 days",
    officialUrl: "https://help.pennie.com/hc/en-us/articles/1500001872842-Reporting-changes-to-Pennie-throughout-the-year", online: true,
  },
  {
    id: "aca-renewal", program: "ACA", category: "reapply",
    title: "Annual Open Enrollment renewal", agency: "Pennie (PA exchange)",
    purpose: "Update income and confirm/change your plan each Open Enrollment.",
    frequency: "Annual", officialUrl: "https://pennie.com/learn/how-to-enroll-2/", online: true,
  },

  // ----------------------------- VA -----------------------------
  {
    id: "va-21p0969", program: "VA", category: "reporting", formNumber: "21P-0969",
    title: "Income and Asset Statement", agency: "U.S. Dept. of Veterans Affairs",
    purpose: "Report or update income, assets, and net worth for pension / Parents' DIC.",
    frequency: "As needed", officialUrl: "https://www.vba.va.gov/pubs/forms/VBA-21P-0969-ARE.pdf",
  },
  {
    id: "va-21p8416", program: "VA", category: "reporting", formNumber: "21P-8416",
    title: "Medical Expense Report", agency: "U.S. Dept. of Veterans Affairs",
    purpose: "Report unreimbursed medical expenses to deduct from countable income.",
    frequency: "As needed", officialUrl: "https://www.vba.va.gov/pubs/forms/vba-21p-8416-are.pdf",
  },
  {
    id: "va-21-0538", program: "VA", category: "reporting", formNumber: "21-0538",
    title: "Status of Dependents Questionnaire", agency: "U.S. Dept. of Veterans Affairs",
    purpose: "Verify dependents so dependency-based compensation continues (respond within 60 days).",
    frequency: "When requested", officialUrl: "https://www.vba.va.gov/pubs/forms/VBA-21-0538-ARE.pdf",
  },
  {
    id: "va-21p527ez", program: "VA", category: "reapply", formNumber: "21P-527EZ",
    title: "Application for Veterans Pension", agency: "U.S. Dept. of Veterans Affairs",
    purpose: "Apply or re-establish Veterans Pension (income-tested).",
    frequency: "At application", officialUrl: "https://www.vba.va.gov/pubs/forms/VBA-21P-527EZ-ARE.pdf",
  },

  // ----------------------------- ABLE -----------------------------
  {
    id: "able-towork", program: "ABLE", category: "reporting",
    title: "ABLE to Work Certification", agency: "PA ABLE",
    purpose: "Self-certify employment to allow the extra ABLE-to-Work contribution.",
    frequency: "As needed", officialUrl: "https://paable.gov/pdf/ABLEtoWork.pdf",
  },
  {
    id: "able-enroll", program: "ABLE", category: "reapply",
    title: "PA ABLE Enrollment Application", agency: "PA ABLE",
    purpose: "Open an account and self-certify disability eligibility (no annual renewal form).",
    frequency: "Once / as needed", officialUrl: "https://www.paable.gov/pdf/Enrollment-Application.pdf",
  },
];

/** All forms for a program, or for several. */
export function formsForPrograms(programs: Program[]): CatalogForm[] {
  const set = new Set(programs);
  return FORMS_CATALOG.filter((f) => set.has(f.program));
}

/** Friendly program labels for headings. */
export const PROGRAM_LABELS: Record<Program, string> = {
  SSI: "SSI — Supplemental Security Income",
  SSDI: "SSDI — Social Security Disability Insurance",
  SNAP: "SNAP — Food assistance",
  Medicaid: "Medicaid — Medical Assistance",
  Section8: "Section 8 — Housing Choice Voucher",
  TANF: "TANF — Cash Assistance",
  WIC: "WIC — Women, Infants & Children",
  LIHEAP: "LIHEAP — Home energy assistance",
  ACA: "ACA — Pennie marketplace",
  VA: "VA — Veterans benefits",
  ABLE: "ABLE — Disability savings",
};
