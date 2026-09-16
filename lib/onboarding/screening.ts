import type { StoredProgram } from "@/lib/programs";

export const SCREEN_STATUSES = ["current", "possible", "no", "unknown"] as const;
export type ScreenStatus = (typeof SCREEN_STATUSES)[number];

export const TRUST_STATUSES = ["exists", "possible", "no", "unknown"] as const;
export type TrustStatus = (typeof TRUST_STATUSES)[number];

export type ScreeningChoice = ScreenStatus | TrustStatus;

export type ScreeningItem = {
  id: string;
  program: string;
  who: string;
  confirms: string;
  vault: string;
  kind: "benefit" | "account";
  note?: string;
};

/** Section 5 — Quick Signup Screening Chart. One item per wizard step. */
export const SCREENING_ITEMS: readonly ScreeningItem[] = [
  {
    id: "ssdi",
    program: "SSDI / DIB",
    who: "Person with a disability and sufficient own work history.",
    confirms: "SSA benefit letter or award notice.",
    vault: "Current SSA verification, plus a BPQY if the person works.",
    kind: "benefit",
  },
  {
    id: "dac",
    program: "DAC / CDB",
    who: "Adult whose disability began before 22 and who may qualify on a parent’s record.",
    confirms: "SSA DAC/CDB award or verification.",
    vault: "Benefit letter plus entitlement history.",
    kind: "benefit",
    note: "Never assume all DAC/CDB income is disregarded for Medicaid. §1634(c) needs prior SSI history.",
  },
  {
    id: "ssi",
    program: "SSI",
    who: "Low-income/resource person who is aged, blind, or disabled.",
    confirms: "Current SSA SSI award or payment record.",
    vault: "SSI letter plus resource and income records.",
    kind: "benefit",
    note: "Do not assume SSI enrollment without a current official record.",
  },
  {
    id: "medicare_ab",
    program: "Medicare A/B",
    who: "Age, disability, or other Medicare-qualified person.",
    confirms: "Medicare card or entitlement record.",
    vault: "Medicare entitlement evidence (Parts A/B effective dates).",
    kind: "benefit",
    note: "Medicare is not Medicaid and not Social Security — they interact but are legally distinct.",
  },
  {
    id: "medicare_plan",
    program: "Medicare Advantage / Part D",
    who: "Medicare beneficiary enrolled in a private plan or drug plan.",
    confirms: "Plan enrollment record or card.",
    vault: "Current plan evidence.",
    kind: "benefit",
  },
  {
    id: "qmb",
    program: "QMB",
    who: "Medicare beneficiary with limited income and resources.",
    confirms: "State QMB / MSP notice.",
    vault: "Eligibility notice plus budget.",
    kind: "benefit",
    note: "This is QMB (Qualified Medicare Beneficiary), not “QMD.”",
  },
  {
    id: "slmb",
    program: "SLMB",
    who: "Medicare beneficiary above the QMB range who may qualify for Part B premium help.",
    confirms: "State SLMB notice.",
    vault: "Eligibility notice plus budget.",
    kind: "benefit",
  },
  {
    id: "qi",
    program: "QI",
    who: "Medicare beneficiary in the QI range who is not otherwise Medicaid eligible.",
    confirms: "State QI notice.",
    vault: "Eligibility notice plus budget.",
    kind: "benefit",
    note: "QI is unavailable to someone otherwise eligible for Medicaid.",
  },
  {
    id: "extra_help",
    program: "Part D Extra Help",
    who: "Medicare drug-plan beneficiary with Medicaid, SSI, MSP, or qualifying income/resources.",
    confirms: "Extra Help notice or automatic-eligibility basis.",
    vault: "Determination or automatic-qualifier proof.",
    kind: "benefit",
  },
  {
    id: "medicaid",
    program: "PA Medical Assistance / Medicaid",
    who: "Person with possible eligibility under disability, MAGI, aged, waiver, MAWD, or another pathway.",
    confirms: "Current DHS eligibility notice.",
    vault: "Notice showing the exact Medical Assistance category.",
    kind: "benefit",
    note: "There is no single Pennsylvania Medicaid limit. Identify the category first.",
  },
  {
    id: "hcbs",
    program: "HCBS / Waiver",
    who: "Person needing authorized home- and community-based long-term services.",
    confirms: "Waiver enrollment or service authorization.",
    vault: "Waiver/HCBS approval plus service plan.",
    kind: "benefit",
    note: "Never treat $2,982 as a universal waiver ceiling. A working disabled person may have MAWD instead.",
  },
  {
    id: "mawd",
    program: "MAWD",
    who: "Working person with a disability who may need Medicaid.",
    confirms: "MAWD approval notice.",
    vault: "MAWD notice plus premium and budget.",
    kind: "benefit",
    note: "Do not assume MAWD enrollment without a current official record.",
  },
  {
    id: "wjs",
    program: "MAWD — Workers with Job Success",
    who: "Higher-income worker already meeting the WJS pathway conditions.",
    confirms: "WJS approval notice.",
    vault: "WJS notice plus prior MAWD history.",
    kind: "benefit",
  },
  {
    id: "snap",
    program: "SNAP",
    who: "Household that may qualify for food assistance.",
    confirms: "Current DHS SNAP notice or EBT case record.",
    vault: "SNAP notice, budget, and renewal date.",
    kind: "benefit",
  },
  {
    id: "snt",
    program: "Special Needs Trust (not a benefit)",
    who: "Beneficiary with a special-needs trust or a possible trust-planning issue.",
    confirms: "Trust instrument or trustee certification.",
    vault: "Trust document plus trustee contacts.",
    kind: "account",
  },
  {
    id: "able",
    program: "ABLE (not a benefit)",
    who: "Eligible person with or considering an ABLE account.",
    confirms: "ABLE account record.",
    vault: "Account proof plus authorized individual.",
    kind: "account",
  },
];

export const MEDICAID_CATEGORIES = [
  { id: "abd", label: "ABD / Healthy Horizons (aged, blind, or disabled)" },
  { id: "magi", label: "MAGI / expansion adult or family" },
  { id: "unknown", label: "Current, but I don’t know the exact category yet" },
] as const;

export type MedicaidCategory = (typeof MEDICAID_CATEGORIES)[number]["id"];

export type BenefitScreeningState = {
  answers: Record<string, ScreeningChoice>;
  medicaidCategory?: MedicaidCategory | "";
};

/** Programs we persist as enrolled when the chart answer is Current (or Exists for ABLE). */
export function enrollmentsFromScreening(state: BenefitScreeningState): { program: StoredProgram; contextData: Record<string, unknown> }[] {
  const answers = state.answers;
  const enrolled = new Map<string, { program: StoredProgram; contextData: Record<string, unknown> }>();

  function add(program: StoredProgram, extra: Record<string, unknown> = {}) {
    const prior = enrolled.get(program);
    enrolled.set(program, {
      program,
      contextData: { ...(prior?.contextData ?? {}), ...extra, screening: "current" },
    });
  }

  if (answers.ssdi === "current") add("SSDI");
  if (answers.dac === "current") add("DAC");
  if (answers.ssi === "current") add("SSI");
  if (answers.qmb === "current") add("QMB");
  if (answers.extra_help === "current") add("ExtraHelp");
  if (answers.snap === "current") add("SNAP");
  if (answers.able === "exists" || answers.able === "current") add("ABLE");
  if (answers.hcbs === "current") add("MedicaidWaiver");
  if (answers.mawd === "current") add("MAWD");
  if (answers.wjs === "current") add("MAWD", { workersWithJobSuccess: true });

  if (answers.medicaid === "current") {
    if (state.medicaidCategory === "abd") add("MedicaidABD");
    else if (state.medicaidCategory === "magi") add("MedicaidMAGI");
  }

  return [...enrolled.values()];
}

export function isChoiceComplete(item: ScreeningItem, choice: ScreeningChoice | undefined, medicaidCategory: string | undefined): boolean {
  if (!choice) return false;
  if (item.kind === "account") {
    return (TRUST_STATUSES as readonly string[]).includes(choice);
  }
  if (!(SCREEN_STATUSES as readonly string[]).includes(choice)) return false;
  if (item.id === "medicaid" && choice === "current") {
    return medicaidCategory === "abd" || medicaidCategory === "magi" || medicaidCategory === "unknown";
  }
  return true;
}
