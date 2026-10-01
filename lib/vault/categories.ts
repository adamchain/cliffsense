/**
 * Preset Vault folders from the Benefit Monitor opening instructions
 * (Section 3 — Necessary Documents, plus the Section 5 screening chart).
 * Legacy category ids stay valid so older uploads still open.
 */

export type VaultSlotKind = "proof" | "keep";

export type VaultSlot = {
  id: string;
  label: string;
  /** One line: what to file, and when. */
  hint: string;
  /**
   * Screening ids, enrolled program ids, or authority ids that make this proof
   * relevant. Empty means every case needs it.
   */
  when: readonly string[];
  /** "keep" is an ongoing filing place, not a single missing document. */
  kind: VaultSlotKind;
};

export type VaultFolderDef = {
  id: string;
  label: string;
  hint: string;
  /** Folder tint, used by the card icon. */
  tint: string;
  slots: readonly VaultSlot[];
};

const TITLE_II = ["ssdi", "SSDI", "dac", "DAC"] as const;
const MEANS = [
  "ssi",
  "SSI",
  "snap",
  "SNAP",
  "medicaid",
  "Medicaid",
  "MedicaidABD",
  "MedicaidMAGI",
  "hcbs",
  "MedicaidWaiver",
  "mawd",
  "MAWD",
  "wjs",
  "qmb",
  "QMB",
  "slmb",
  "qi",
  "extra_help",
  "ExtraHelp",
] as const;
const MEDICAID = ["medicaid", "Medicaid", "MedicaidABD", "MedicaidMAGI", "hcbs", "MedicaidWaiver", "mawd", "MAWD", "wjs"] as const;
const SSA = ["ssdi", "SSDI", "dac", "DAC", "ssi", "SSI"] as const;

export const VAULT_FOLDERS: readonly VaultFolderDef[] = [
  {
    id: "identity",
    label: "Identity & authority",
    hint: "Who the person is, and what lets the Monitor act.",
    tint: "#5856D6",
    slots: [
      {
        id: "gov_id",
        label: "Government ID",
        hint: "Photo ID or another basic identity record for this case.",
        when: [],
        kind: "proof",
      },
      {
        id: "consent",
        label: "Bene-Watch authorization",
        hint: "Signed consent to use Bene-Watch and share records the person may share.",
        when: [],
        kind: "proof",
      },
      {
        id: "poa",
        label: "Power of attorney",
        hint: "The executed POA, any required certification, and revocation status if it matters.",
        when: ["poa"],
        kind: "proof",
      },
      {
        id: "payee",
        label: "SSA representative payee",
        hint: "SSA appointment or selection notice. A power of attorney is not a payee appointment.",
        when: ["ssa_payee"],
        kind: "proof",
      },
      {
        id: "auth_rep",
        label: "Authorized representative",
        hint: "Agency designation, acceptance, and any scope or expiration.",
        when: ["program_rep"],
        kind: "proof",
      },
      {
        id: "guardianship",
        label: "Guardianship order",
        hint: "The court order, if one applies.",
        when: ["guardianship"],
        kind: "proof",
      },
      {
        id: "account_authority",
        label: "Trustee or ABLE authority",
        hint: "Trust certification or ABLE authorized-individual proof.",
        when: ["trustee", "able", "snt", "ABLE"],
        kind: "proof",
      },
    ],
  },
  {
    id: "social_security",
    label: "Social Security & SSI",
    hint: "The letter that names each benefit actually payable.",
    tint: "#007AFF",
    slots: [
      {
        id: "ssa_verification",
        label: "Benefit verification letter",
        hint: "Current SSA letter for SSDI, DAC/CDB, SSI, or whichever benefits are payable.",
        when: SSA,
        kind: "proof",
      },
      {
        id: "award_notice",
        label: "Award or entitlement notice",
        hint: "Benefit type, onset or entitlement date, and history — including DAC/CDB on a parent’s record.",
        when: TITLE_II,
        kind: "proof",
      },
      {
        id: "ssi_record",
        label: "SSI letter and resources",
        hint: "Current SSI award or payment record, plus resource and income proof.",
        when: ["ssi", "SSI"],
        kind: "proof",
      },
      {
        id: "bpqy",
        label: "BPQY / work history",
        hint: "Trial Work Period and Extended Period of Eligibility, if the person works or may work more.",
        when: TITLE_II,
        kind: "proof",
      },
      {
        id: "work_reports",
        label: "Work reports and SSA receipts",
        hint: "Reports sent to SSA and the confirmation that SSA received them.",
        when: SSA,
        kind: "proof",
      },
      {
        id: "cdr",
        label: "Continuing disability review",
        hint: "SSA-454, SSA-455, or a related request. Use the date on the notice.",
        when: SSA,
        kind: "proof",
      },
      {
        id: "section_1634",
        label: "Prior SSI for §1634(c)",
        hint: "Prior SSI, the DAC/CDB entitlement or increase, and why SSI ended.",
        when: ["dac", "DAC"],
        kind: "proof",
      },
    ],
  },
  {
    id: "medicare",
    label: "Medicare & assistance",
    hint: "Parts A/B, the plan, and any state help with premiums.",
    tint: "#32ADE6",
    slots: [
      {
        id: "medicare_entitlement",
        label: "Medicare Parts A/B",
        hint: "Card or entitlement record with Part A and Part B effective dates.",
        when: ["medicare_ab"],
        kind: "proof",
      },
      {
        id: "medicare_plan",
        label: "Advantage or Part D plan",
        hint: "Current enrollment evidence for a Medicare Advantage or drug plan.",
        when: ["medicare_plan"],
        kind: "proof",
      },
      {
        id: "qmb_notice",
        label: "QMB notice and budget",
        hint: "State QMB eligibility notice. This program is QMB, not “QMD.”",
        when: ["qmb", "QMB"],
        kind: "proof",
      },
      {
        id: "slmb_notice",
        label: "SLMB notice and budget",
        hint: "State SLMB eligibility notice and the income/resource budget if you have it.",
        when: ["slmb"],
        kind: "proof",
      },
      {
        id: "qi_notice",
        label: "QI notice and budget",
        hint: "State QI notice. QI is unavailable to someone otherwise eligible for Medicaid.",
        when: ["qi"],
        kind: "proof",
      },
      {
        id: "extra_help",
        label: "Part D Extra Help",
        hint: "Determination, or proof of automatic qualification through Medicaid, SSI, or an MSP.",
        when: ["extra_help", "ExtraHelp"],
        kind: "proof",
      },
      {
        id: "premium_buyin",
        label: "Premium withholding or buy-in",
        hint: "Notices showing who pays the Medicare premium, including state buy-in.",
        when: ["medicare_ab", "qmb", "QMB", "slmb", "qi"],
        kind: "proof",
      },
    ],
  },
  {
    id: "medicaid",
    label: "Medicaid, MAWD & HCBS",
    hint: "The notice that names the exact Medical Assistance category.",
    tint: "#34C759",
    slots: [
      {
        id: "ma_category",
        label: "Exact category notice",
        hint: "Current DHS notice with the Medical Assistance category and effective date.",
        when: MEDICAID,
        kind: "proof",
      },
      {
        id: "ma_renewal",
        label: "Renewal determination",
        hint: "The latest renewal and the next due date from the notice.",
        when: MEDICAID,
        kind: "proof",
      },
      {
        id: "ma_card",
        label: "Medical Assistance card",
        hint: "Enough to identify the program. Leave full ID numbers and passwords out.",
        when: MEDICAID,
        kind: "proof",
      },
      {
        id: "hcbs_plan",
        label: "Waiver approval and service plan",
        hint: "HCBS enrollment or authorization, service plan, and supports coordinator.",
        when: ["hcbs", "MedicaidWaiver"],
        kind: "proof",
      },
      {
        id: "hcbs_functional",
        label: "Functional or clinical eligibility",
        hint: "Level-of-care or clinical records for the waiver, kept separate from the financial notice.",
        when: ["hcbs", "MedicaidWaiver"],
        kind: "proof",
      },
      {
        id: "medical_records",
        label: "Medical records",
        hint: "Visit notes, labs, and treatment plans used for a review or waiver.",
        when: [...SSA, ...MEDICAID],
        kind: "proof",
      },
      {
        id: "mawd_notice",
        label: "MAWD notice, premium, and budget",
        hint: "Approval notice, premium notice, and the current income and resource calculation.",
        when: ["mawd", "MAWD", "wjs"],
        kind: "proof",
      },
      {
        id: "wjs_notice",
        label: "Workers with Job Success",
        hint: "WJS approval, premium, budget, and prior MAWD history.",
        when: ["wjs"],
        kind: "proof",
      },
    ],
  },
  {
    id: "snap",
    label: "SNAP",
    hint: "The notice, the budget, and the next renewal or SAR date.",
    tint: "#FF9500",
    slots: [
      {
        id: "snap_notice",
        label: "Eligibility notice and budget",
        hint: "Current SNAP benefit notice and the agency calculation when you have it.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
      {
        id: "snap_sar",
        label: "Renewal and SAR dates",
        hint: "Renewal and semi-annual reporting dates taken from the actual notices.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
      {
        id: "snap_income",
        label: "Wage and Social Security income",
        hint: "Income records the SNAP budget relies on.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
      {
        id: "snap_shelter",
        label: "Rent, shelter, and utilities",
        hint: "Lease or rent verification, shelter obligation, and current utility proof.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
      {
        id: "snap_medical",
        label: "Unreimbursed medical expenses",
        hint: "Allowable medical costs for an elderly or disabled household member.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
      {
        id: "snap_submissions",
        label: "Verifications and hearing notices",
        hint: "Submission receipts, interview notices, verification requests, and fair-hearing notices.",
        when: ["snap", "SNAP"],
        kind: "proof",
      },
    ],
  },
  {
    id: "income",
    label: "Income, resources & household",
    hint: "Gross wages, resources, housing, and work-incentive proof.",
    tint: "#AF52DE",
    slots: [
      {
        id: "pay_stubs",
        label: "Pay stubs and employer",
        hint: "Gross wages, pay period, and hours — not just the bank deposit date.",
        when: [...MEANS, ...TITLE_II],
        kind: "proof",
      },
      {
        id: "bank_statements",
        label: "Bank statements",
        hint: "Statements needed for resource monitoring. Limit them to authorized users.",
        when: MEANS,
        kind: "proof",
      },
      {
        id: "other_income",
        label: "Other income and resources",
        hint: "Pensions, unemployment, gifts, inheritances, settlements, or recurring support.",
        when: MEANS,
        kind: "proof",
      },
      {
        id: "household",
        label: "Household and housing",
        hint: "Lease, housing contribution, household composition, and major recurring bills.",
        when: ["ssi", "SSI", "snap", "SNAP", ...MEDICAID],
        kind: "proof",
      },
      {
        id: "work_incentives",
        label: "Work-incentive evidence",
        hint: "Impairment-related work expenses, subsidies, special conditions, or unsuccessful work attempts.",
        when: [...TITLE_II, "mawd", "MAWD", "wjs"],
        kind: "proof",
      },
      {
        id: "titles",
        label: "Titles and deeds",
        hint: "Property and vehicle records that can count as resources.",
        when: MEANS,
        kind: "proof",
      },
    ],
  },
  {
    id: "snt_able",
    label: "SNT & ABLE",
    hint: "The instrument, who controls it, and each distribution.",
    tint: "#FF2D55",
    slots: [
      {
        id: "trust_instrument",
        label: "Trust document and trustee",
        hint: "Governing instrument or certification, plus trustee name and contact.",
        when: ["snt", "trustee"],
        kind: "proof",
      },
      {
        id: "able_account",
        label: "ABLE account proof",
        hint: "Account record and authorized-individual documentation. SSI cash rules use the balance.",
        when: ["able", "ABLE"],
        kind: "proof",
      },
      {
        id: "proposed_distribution",
        label: "Proposed distribution",
        hint: "Amount, payee, purpose, date, and whether cash will enter the personal account.",
        when: ["snt", "trustee", "able", "ABLE"],
        kind: "proof",
      },
      {
        id: "distribution_receipts",
        label: "Receipts after a distribution",
        hint: "Invoices, trustee records, and which expense category the payment was.",
        when: ["snt", "trustee", "able", "ABLE"],
        kind: "proof",
      },
    ],
  },
  {
    id: "notices",
    label: "Notices, submissions & appeals",
    hint: "The full evidence chain: what was required, sent, received, and decided.",
    tint: "#FF6B4A",
    slots: [
      {
        id: "agency_notice",
        label: "Agency notices",
        hint: "Every notice, all pages. Keep the envelope when the mailing date matters.",
        when: [],
        kind: "keep",
      },
      {
        id: "submission",
        label: "Applications, renewals, and reports",
        hint: "What was actually submitted — renewal, SAR, verification, work report, or appeal.",
        when: [],
        kind: "keep",
      },
      {
        id: "proof_of_send",
        label: "Proof it was sent",
        hint: "Portal receipt, confirmation number, fax, certified mail, or email confirmation.",
        when: [],
        kind: "keep",
      },
      {
        id: "agency_response",
        label: "Responses and decisions",
        hint: "Caseworker requests, fair-hearing notices, decisions, overpayments, and reinstatements.",
        when: [],
        kind: "keep",
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    hint: "Anything that does not belong in a folder above.",
    tint: "#8E8E93",
    slots: [],
  },
];

const SLOT_BY_ID = new Map<string, { folderId: string; slot: VaultSlot }>();
for (const folder of VAULT_FOLDERS) {
  for (const slot of folder.slots) {
    SLOT_BY_ID.set(slot.id, { folderId: folder.id, slot });
  }
}

/** Categories offered as folders. */
export const VAULT_CATEGORIES: { id: string; label: string; hint: string }[] = VAULT_FOLDERS.map(
  (folder) => ({ id: folder.id, label: folder.label, hint: folder.hint }),
);

/** All ids accepted by the API / schema (current folders + legacy). */
export const VAULT_CATEGORY_IDS = [
  ...VAULT_FOLDERS.map((folder) => folder.id),
  "medical_records",
  "disability_proof",
  "job_income",
  "expenses",
  "work_activity",
  "able_snt",
  "title_deed",
  "correspondence",
  "receipts",
  "award_letter",
  "income_verification",
  "renewal",
  "asset_statement",
] as const;

export type VaultCategoryId = (typeof VAULT_CATEGORY_IDS)[number];

/** Map legacy uploads into the current folder. */
const LEGACY_SECTION: Record<string, string> = {
  medical_records: "medicaid",
  disability_proof: "social_security",
  job_income: "income",
  expenses: "income",
  work_activity: "income",
  able_snt: "snt_able",
  title_deed: "income",
  correspondence: "notices",
  receipts: "income",
  award_letter: "social_security",
  income_verification: "income",
  renewal: "medicaid",
  asset_statement: "snt_able",
};

/** Where an older upload sits in the checklist when it has no slot id. */
const LEGACY_SLOT: Record<string, string> = {
  medical_records: "medical_records",
  disability_proof: "award_notice",
  job_income: "pay_stubs",
  expenses: "household",
  work_activity: "work_incentives",
  able_snt: "able_account",
  title_deed: "titles",
  correspondence: "agency_notice",
  receipts: "household",
  award_letter: "award_notice",
  income_verification: "pay_stubs",
  renewal: "ma_renewal",
  asset_statement: "able_account",
};

export type SlotAttention = "needed" | "review" | "optional" | "keep";

export type VaultCaseContext = {
  /** Screening "current"/"exists", enrolled programs, and authority ids. */
  active: ReadonlySet<string>;
  /** Screening "possible" or "unknown". */
  review: ReadonlySet<string>;
};

export function vaultSectionId(category: string): string {
  return LEGACY_SECTION[category] ?? category;
}

export function vaultSlot(slotId: string): VaultSlot | null {
  return SLOT_BY_ID.get(slotId)?.slot ?? null;
}

export function folderIdForSlot(slotId: string): string | null {
  return SLOT_BY_ID.get(slotId)?.folderId ?? null;
}

export function slotBelongsToFolder(folderId: string, slotId: string): boolean {
  return SLOT_BY_ID.get(slotId)?.folderId === folderId;
}

export function effectiveVaultSlot(category: string, slot: string | null | undefined): string | null {
  const trimmed = (slot ?? "").trim();
  if (trimmed && SLOT_BY_ID.has(trimmed)) return trimmed;
  return LEGACY_SLOT[category] ?? null;
}

export function folderIdForDocument(category: string, slot: string | null | undefined): string {
  const effective = effectiveVaultSlot(category, slot);
  if (effective) {
    const folderId = folderIdForSlot(effective);
    if (folderId) return folderId;
  }
  return vaultSectionId(category);
}

export function vaultCategoryLabel(category: string): string {
  const section = VAULT_FOLDERS.find((folder) => folder.id === vaultSectionId(category));
  if (section) return section.label;
  return category.replace(/_/g, " ");
}

export function vaultSlotLabel(slotId: string | null | undefined): string | null {
  if (!slotId) return null;
  return SLOT_BY_ID.get(slotId)?.slot.label ?? null;
}

export function slotAttention(slot: VaultSlot, ctx: VaultCaseContext): SlotAttention {
  if (slot.kind === "keep") return "keep";
  if (slot.when.length === 0) return "needed";
  if (slot.when.some((key) => ctx.active.has(key))) return "needed";
  if (slot.when.some((key) => ctx.review.has(key))) return "review";
  return "optional";
}

const ACTIVE_ANSWERS = new Set(["current", "exists"]);
const REVIEW_ANSWERS = new Set(["possible", "unknown"]);

export function vaultCaseContext(input: {
  screening?: Record<string, string> | null;
  enrolled?: readonly string[];
  authorities?: readonly string[];
  /** Extra active keys, such as Workers with Job Success stored on MAWD. */
  extraActive?: readonly string[];
}): VaultCaseContext {
  const active = new Set<string>([...(input.enrolled ?? []), ...(input.authorities ?? []), ...(input.extraActive ?? [])]);
  const review = new Set<string>();
  for (const [key, value] of Object.entries(input.screening ?? {})) {
    if (ACTIVE_ANSWERS.has(value)) active.add(key);
    else if (REVIEW_ANSWERS.has(value)) review.add(key);
  }
  return { active, review };
}

/**
 * Record types the app prompts users to track beyond checking accounts.
 * Kept so older imports still resolve to a folder.
 */
export const MONITORING_SOURCES: { id: string; label: string; detail: string; categoryId: string }[] =
  [
    {
      id: "pay_stubs",
      label: "Pay stubs",
      detail: "Track gross wages and pay period — not just the bank deposit date.",
      categoryId: "income",
    },
    {
      id: "snt_ledgers",
      label: "SNT disbursement ledgers",
      detail: "How the trust paid matters (cash vs. vendor shelter vs. food/excluded).",
      categoryId: "snt_able",
    },
    {
      id: "vendor_invoices",
      label: "Vendor invoices & receipts",
      detail: "Rent, utilities, medical, and other bills paid on the beneficiary’s behalf.",
      categoryId: "income",
    },
    {
      id: "able_statements",
      label: "ABLE account statements",
      detail: "SSI cash suspends when ABLE balances exceed $100,000 (Medicaid can continue).",
      categoryId: "snt_able",
    },
    {
      id: "title_deed",
      label: "Title & deed registries",
      detail: "Property and vehicle ownership records that can affect resource counts.",
      categoryId: "income",
    },
  ];
