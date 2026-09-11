import {
  POLICY_RULES,
  gateLabel,
  ruleGate,
  type PolicyRuleId,
  type RuleGate,
} from "@/lib/policy/rules";

export type ImmigrationCategory =
  | "us_citizen"
  | "lpr"
  | "refugee_asylee"
  | "parole_other_lawful"
  | "undocumented"
  | "unknown";

export type PolicyScreenAnswers = {
  age: number | null;
  youngestChildAge: number | null;
  veteran: boolean;
  formerFosterYouth: boolean;
  pregnant: boolean;
  disabilityLimitsWork: boolean;
  caregiverIncapacitated: boolean;
  magiHours: number | null;
  magiExemptionIds: string[];
  immigrationCategory: ImmigrationCategory;
  receivedImmigrantNotice: boolean;
};

export const EMPTY_POLICY_ANSWERS: PolicyScreenAnswers = {
  age: null,
  youngestChildAge: null,
  veteran: false,
  formerFosterYouth: false,
  pregnant: false,
  disabilityLimitsWork: false,
  caregiverIncapacitated: false,
  magiHours: null,
  magiExemptionIds: [],
  immigrationCategory: "unknown",
  receivedImmigrantNotice: false,
};

export function ageFromDateOfBirth(
  dob: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (dob == null || dob === "") return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const month = now.getUTCMonth() - d.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function coercePolicyScreen(
  raw: unknown,
  fallbackAge: number | null = null,
): PolicyScreenAnswers {
  const base = { ...EMPTY_POLICY_ANSWERS, age: fallbackAge };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const cats: ImmigrationCategory[] = [
    "us_citizen",
    "lpr",
    "refugee_asylee",
    "parole_other_lawful",
    "undocumented",
    "unknown",
  ];
  const cat = cats.includes(o.immigrationCategory as ImmigrationCategory)
    ? (o.immigrationCategory as ImmigrationCategory)
    : "unknown";
  return {
    age: typeof o.age === "number" ? o.age : fallbackAge,
    youngestChildAge: typeof o.youngestChildAge === "number" ? o.youngestChildAge : null,
    veteran: Boolean(o.veteran),
    formerFosterYouth: Boolean(o.formerFosterYouth),
    pregnant: Boolean(o.pregnant),
    disabilityLimitsWork: Boolean(o.disabilityLimitsWork),
    caregiverIncapacitated: Boolean(o.caregiverIncapacitated),
    magiHours: typeof o.magiHours === "number" ? o.magiHours : null,
    magiExemptionIds: Array.isArray(o.magiExemptionIds)
      ? o.magiExemptionIds.filter((id): id is string => typeof id === "string")
      : [],
    immigrationCategory: cat,
    receivedImmigrantNotice: Boolean(o.receivedImmigrantNotice),
  };
}

export const MAGI_EXEMPTION_OPTIONS = [
  { id: "pregnant", label: "Pregnant" },
  { id: "caregiver", label: "Primary caregiver of a dependent child or incapacitated person" },
  { id: "unemployment", label: "Receiving unemployment compensation" },
  { id: "sud", label: "In a substance-use disorder treatment program" },
  { id: "frail", label: "Medically frail (needs proof the condition limits 80 hours/month)" },
  { id: "aian", label: "American Indian / Alaska Native (if Pennsylvania adopts that exemption)" },
] as const;

export type ExemptionFlag = {
  id: string;
  label: string;
  status: "possible" | "removed" | "not_enough";
  note: string;
};

export type ScreenResult = {
  ruleId: PolicyRuleId;
  gate: RuleGate;
  gateLabel: string;
  headline: string;
  detail: string;
  flags: ExemptionFlag[];
  playbookId: string;
  documents: string[];
};

function ageSubjectToExpandedSnap(age: number | null): boolean | null {
  if (age == null) return null;
  if (age >= 65) return false;
  if (age < 18) return false;
  return true;
}

export function evaluateSnapWork(
  a: PolicyScreenAnswers,
  now: Date = new Date(),
): ScreenResult {
  const rule = POLICY_RULES.snap_work_expansion;
  const gate = ruleGate(rule, now);
  const flags: ExemptionFlag[] = [];
  const subject = ageSubjectToExpandedSnap(a.age);

  if (a.veteran) {
    flags.push({
      id: "veteran",
      label: "Veteran status",
      status: "removed",
      note: "The deck says the former SNAP veteran exemption was eliminated. Screen other exemptions; do not stop at veteran status.",
    });
  }
  if (a.formerFosterYouth) {
    flags.push({
      id: "foster",
      label: "Former foster youth",
      status: "removed",
      note: "The deck says the former foster-youth SNAP exemption was eliminated.",
    });
  }
  if (a.youngestChildAge != null && a.youngestChildAge < 14) {
    flags.push({
      id: "child_under_14",
      label: "Caregiver of a child under 14",
      status: "possible",
      note: "May still support an exemption if the final PA rule keeps a young-child caregiver exemption. Verify the exact age cutoff.",
    });
  } else if (a.youngestChildAge != null && a.youngestChildAge >= 14) {
    flags.push({
      id: "child_14_plus",
      label: "Parent of a child age 14 or older",
      status: "not_enough",
      note: "The deck says caregivers of children 14+ may be newly exposed. Parent of a minor is not automatically protective.",
    });
  }
  if (a.pregnant) {
    flags.push({
      id: "pregnant",
      label: "Pregnancy",
      status: "possible",
      note: "Screen pregnancy as a remaining exemption under current guidance.",
    });
  }
  if (a.disabilityLimitsWork) {
    flags.push({
      id: "medical",
      label: "Disability or medical unfitness",
      status: "possible",
      note: "Obtain a clinician statement even if no disability benefit is in pay. Do not wait for a VA or SSA rating.",
    });
  }
  if (a.caregiverIncapacitated) {
    flags.push({
      id: "incapacitated",
      label: "Caregiving for an incapacitated person",
      status: "possible",
      note: "Document the care need separately from parenting a healthy teenager.",
    });
  }

  const remaining = flags.filter((f) => f.status === "possible");
  let playbookId = "snap_work_exemption_lost";
  if (a.veteran && remaining.length === 0) playbookId = "snap_work_exemption_lost";
  if (a.formerFosterYouth && remaining.length === 0) playbookId = "snap_work_exemption_lost";
  if (a.youngestChildAge != null && a.youngestChildAge >= 14 && remaining.length === 0) {
    playbookId = "snap_work_exemption_lost";
  }
  if (subject === false && a.age != null && a.age >= 65) {
    playbookId = "snap_work_exemption_lost";
  }

  let headline: string;
  if (subject === false && a.age != null && a.age >= 65) {
    headline = "Age 65+ is described as outside the expanded SNAP work band — still verify the cutoff";
  } else if (remaining.length > 0) {
    headline = "Possible remaining exemption — do not report noncompliance yet";
  } else if (subject) {
    headline =
      "If the expanded SNAP rule applies, this person may need documented activity or another exemption";
  } else {
    headline = "Answer age and household questions to see whether the expanded SNAP rule could apply";
  }

  return {
    ruleId: rule.id,
    gate,
    gateLabel: gateLabel(gate),
    headline,
    detail: rule.sourceNote,
    flags,
    playbookId,
    documents: [
      "Birth record or ID showing age",
      "Child’s birth record and school/childcare schedule if claiming caregiving",
      "Clinician statement on ability to work",
      "Monthly activity proof (pay stubs, timesheets, program attendance)",
      "Any SNAP employment-and-training assignment",
    ],
  };
}

export function evaluateMagiWork(
  a: PolicyScreenAnswers,
  now: Date = new Date(),
): ScreenResult {
  const rule = POLICY_RULES.magi_work_80h;
  const gate = ruleGate(rule, now);
  const flags: ExemptionFlag[] = MAGI_EXEMPTION_OPTIONS.filter((opt) =>
    a.magiExemptionIds.includes(opt.id),
  ).map((opt) => ({
    id: opt.id,
    label: opt.label,
    status: "possible" as const,
    note: "Claimed — keep documentation. Diagnosis alone is not enough for medical frailty.",
  }));

  const inAge = a.age == null ? null : a.age >= 19 && a.age <= 64;
  const hoursOk = a.magiHours != null && a.magiHours >= 80;
  const exempt = a.magiExemptionIds.length > 0;

  let headline: string;
  if (inAge === false) {
    headline = "Outside ages 19–64 as described — the MAGI hours rule may not apply";
  } else if (exempt) {
    headline = "An exemption is claimed — verify it under final rules before skipping hours reporting";
  } else if (hoursOk) {
    headline = "Hours meet the 80-hour target on this worksheet — keep payroll proof; irregular stubs may still fail verification";
  } else if (a.magiHours != null) {
    headline = "Hours are below 80 on this worksheet — if the 2027 rule applies, coverage could be at risk without an exemption";
  } else {
    headline = "Enter hours or claim an exemption. Do not assume the 2027 MAGI rule is already in force.";
  }

  return {
    ruleId: rule.id,
    gate,
    gateLabel: gateLabel(gate),
    headline,
    detail: `${rule.sourceNote} Semi-annual MAGI renewal is a separate 2027 projection.`,
    flags: flags,
    playbookId: "magi_work_requirements_2027",
    documents: [
      "Pay stubs, timesheets, and employer hours letter",
      "Exemption evidence (pregnancy, caregiving, medical frailty, unemployment, treatment)",
      "COMPASS submission confirmation",
    ],
  };
}

export function evaluateImmigrantStatus(
  a: PolicyScreenAnswers,
  now: Date = new Date(),
): ScreenResult {
  const rule = POLICY_RULES.immigrant_restrictions_2026;
  const gate = ruleGate(rule, now);
  const flags: ExemptionFlag[] = [];

  let headline: string;
  switch (a.immigrationCategory) {
    case "us_citizen":
      headline = "U.S. citizenship is not the October 2026 ‘lawfully present’ restriction — still read any notice you received";
      break;
    case "refugee_asylee":
      headline = "Refugee/asylee categories are often protected — the agency still misclassifies people. Get the actual notice.";
      flags.push({
        id: "protected",
        label: "Possible protected category",
        status: "possible",
        note: "Counsel should confirm the statutory basis on the notice, waiting periods, and the benefit program involved.",
      });
      break;
    case "lpr":
    case "parole_other_lawful":
      headline = "Lawfully present status can still be restricted or misclassified. Do not rely on a generic closure message.";
      flags.push({
        id: "lawful",
        label: "Lawfully present — high misclassification risk",
        status: "not_enough",
        note: "Submit current immigration documents. Screen emergency Medicaid, pregnancy coverage, CHIP, Marketplace, and food resources.",
      });
      break;
    case "undocumented":
      headline = "Different emergency / pregnancy / local-coverage rules may apply. Get the notice and qualified counsel.";
      break;
    default:
      headline = "Immigration category is unknown — obtain the adverse notice before assuming eligibility ended";
  }

  if (a.receivedImmigrantNotice) {
    flags.push({
      id: "notice",
      label: "Adverse notice received",
      status: "possible",
      note: "Calendar the appeal and any shorter continued-benefits deadline. File a replacement application in parallel.",
    });
  }

  return {
    ruleId: rule.id,
    gate,
    gateLabel: gateLabel(gate),
    headline,
    detail: rule.sourceNote,
    flags,
    playbookId: "immigrant_restrictions_2026",
    documents: [
      "The actual adverse notice (category, statute, effective date, program)",
      "Permanent-resident card, EAD, I-94, asylum/refugee documents as applicable",
      "Replacement applications filed before the termination date",
    ],
  };
}

export function evaluatePolicyScreen(a: PolicyScreenAnswers, now: Date = new Date()) {
  return {
    snap: evaluateSnapWork(a, now),
    magi: evaluateMagiWork(a, now),
    immigrant: evaluateImmigrantStatus(a, now),
  };
}
