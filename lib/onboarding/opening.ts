export const AUTHORITY_OPTIONS = [
  {
    id: "consent",
    label: "Beneficiary consent / Bene-Watch authorization",
    permits: "Use MyBenefitsPA for this person and receive records they are authorized to share.",
    doesNot: "Does not by itself create legal authority with SSA, DHS, a bank, trustee, or health plan.",
  },
  {
    id: "poa",
    label: "Power of Attorney or other legal agency",
    permits: "Financial, banking, records, or bill-pay acts within the actual document and applicable law.",
    doesNot: "A POA is not an SSA representative-payee appointment and does not authorize SSA credentials.",
  },
  {
    id: "ssa_payee",
    label: "SSA Representative Payee",
    permits: "Receive and manage Social Security/SSI payments for the beneficiary as SSA appointed.",
    doesNot: "Cannot be created by POA, joint account, or private agreement. SSA must appoint the payee.",
  },
  {
    id: "program_rep",
    label: "Program-specific authorized representative",
    permits: "Communications, applications, renewals, or appeals as that program recognizes.",
    doesNot: "Does not automatically confer financial control or SSA payee authority.",
  },
  {
    id: "trustee",
    label: "Trustee / trust liaison",
    permits: "Coordinate with the trustee if the trust and legal authority actually permit it.",
    doesNot: "A Monitor should not direct SNT assets unless the governing instrument allows it.",
  },
  {
    id: "able",
    label: "ABLE authorized individual",
    permits: "Only the authority recognized for the ABLE account.",
    doesNot: "Does not make the Monitor owner of the funds or create broader benefit authority.",
  },
  {
    id: "guardianship",
    label: "Guardianship order",
    permits: "Acts allowed by the court order.",
    doesNot: "Does not automatically create SSA payee status or every program authorization.",
  },
] as const;

export const MANAGER_FIELDS = [
  { id: "benefits", label: "Benefits (SSA, DHS, SNAP, Medicaid)" },
  { id: "finances", label: "Day-to-day finances / banking" },
  { id: "healthPlan", label: "Health-plan communications" },
  { id: "waiver", label: "Waiver / HCBS services" },
  { id: "trusts", label: "Trusts (SNT or other)" },
  { id: "able", label: "ABLE funds" },
] as const;

export type AuthorityId = (typeof AUTHORITY_OPTIONS)[number]["id"];
export type ManagerId = (typeof MANAGER_FIELDS)[number]["id"];

export const MARITAL_OPTIONS = [
  { id: "single", label: "Single" },
  { id: "married", label: "Married" },
  { id: "divorced", label: "Divorced" },
  { id: "widowed", label: "Widowed" },
  { id: "unknown", label: "Prefer not to say / unknown" },
] as const;

export const DISABILITY_OPTIONS = [
  { id: "yes", label: "Yes — disability is relevant to benefits" },
  { id: "no", label: "No" },
  { id: "unknown", label: "Unknown / not yet confirmed" },
] as const;
