/**
 * Vault organization. Primary buckets match how families actually file paperwork
 * for benefits continuity; legacy ids stay valid so older uploads still open.
 */

export type VaultCategory = {
  id: string;
  label: string;
  /** Short prompt shown under the section header. */
  hint: string;
};

/** Categories offered in the upload picker and used as section headers. */
export const VAULT_CATEGORIES: VaultCategory[] = [
  {
    id: "medical_records",
    label: "Medical records",
    hint: "Visit notes, labs, prescriptions, treatment plans",
  },
  {
    id: "disability_proof",
    label: "Proof of disability",
    hint: "SSA award letters, disability determinations, medical-frailty documentation",
  },
  {
    id: "job_income",
    label: "Job & income",
    hint: "Pay stubs (use gross wages, not deposit dates), wage statements, SNT disbursement ledgers",
  },
  {
    id: "expenses",
    label: "Expenses",
    hint: "Rent, utilities, medical bills, vendor invoices and receipts",
  },
  {
    id: "work_activity",
    label: "Work & activity",
    hint: "Hours worked, volunteering, job training, education — for Medicaid work rules",
  },
  {
    id: "able_snt",
    label: "ABLE & SNT statements",
    hint: "ABLE balances (SSI suspends when ABLE cash exceeds $100,000) and trust ledgers",
  },
  {
    id: "title_deed",
    label: "Title & deed",
    hint: "Property deeds, vehicle titles, registry extracts",
  },
  {
    id: "correspondence",
    label: "Agency correspondence",
    hint: "Letters from SSA, CAO, DHS, housing authorities",
  },
  {
    id: "other",
    label: "Other",
    hint: "Anything that doesn’t fit above",
  },
];

/** All ids accepted by the API / schema (current + legacy). */
export const VAULT_CATEGORY_IDS = [
  ...VAULT_CATEGORIES.map((c) => c.id),
  // Legacy — still stored on older documents and transaction-linked receipts.
  "receipts",
  "award_letter",
  "income_verification",
  "renewal",
  "asset_statement",
] as const;

export type VaultCategoryId = (typeof VAULT_CATEGORY_IDS)[number];

/** Map legacy uploads into the current section for display. */
const LEGACY_SECTION: Record<string, string> = {
  receipts: "expenses",
  award_letter: "disability_proof",
  income_verification: "job_income",
  renewal: "correspondence",
  asset_statement: "able_snt",
};

export function vaultSectionId(category: string): string {
  return LEGACY_SECTION[category] ?? category;
}

export function vaultCategoryLabel(category: string): string {
  const section = VAULT_CATEGORIES.find((c) => c.id === vaultSectionId(category));
  if (section) return section.label;
  return category.replace(/_/g, " ");
}

/**
 * Record types Frank asked the app to prompt users to track — beyond checking
 * accounts alone. Shown as a checklist on the Vault.
 */
export const MONITORING_SOURCES: { id: string; label: string; detail: string; categoryId: string }[] =
  [
    {
      id: "pay_stubs",
      label: "Pay stubs",
      detail: "Track gross wages and pay period — not just the bank deposit date.",
      categoryId: "job_income",
    },
    {
      id: "snt_ledgers",
      label: "SNT disbursement ledgers",
      detail: "How the trust paid matters (cash vs. vendor shelter vs. food/excluded).",
      categoryId: "able_snt",
    },
    {
      id: "vendor_invoices",
      label: "Vendor invoices & receipts",
      detail: "Rent, utilities, medical, and other bills paid on the beneficiary’s behalf.",
      categoryId: "expenses",
    },
    {
      id: "able_statements",
      label: "ABLE account statements",
      detail: "SSI cash suspends when ABLE balances exceed $100,000 (Medicaid can continue).",
      categoryId: "able_snt",
    },
    {
      id: "title_deed",
      label: "Title & deed registries",
      detail: "Property and vehicle ownership records that can affect resource counts.",
      categoryId: "title_deed",
    },
  ];
