import { programCodeKey } from "@/lib/benefits/program-meta";

/**
 * Renewal is only one deadline. Each program can also have interim reports,
 * change reports, disability or eligibility reviews, and agency requests for
 * documents, each on its own clock. This module keeps those obligations
 * separate so a distant renewal date can never hide an earlier report or
 * document deadline.
 *
 * Program rules here are Pennsylvania-focused and informational only. Every
 * rule records its source and the date it was checked; a printed notice always
 * wins over an expected schedule.
 */

// ---------------------------------------------------------------------------
// Date confidence
// ---------------------------------------------------------------------------

export const DATE_CONFIDENCES = ["confirmed", "estimated", "needs_confirmation"] as const;
export type DateConfidence = (typeof DATE_CONFIDENCES)[number];

export const DATE_CONFIDENCE_LABEL: Record<DateConfidence, string> = {
  confirmed: "Confirmed by agency notice",
  estimated: "Estimated from verified rules",
  needs_confirmation: "Needs confirmation",
};

export function isDateConfidence(value: unknown): value is DateConfidence {
  return typeof value === "string" && (DATE_CONFIDENCES as readonly string[]).includes(value);
}

export function normalizeConfidence(value: unknown): DateConfidence {
  return isDateConfidence(value) ? value : "needs_confirmation";
}

/** Plain-language explanation used across the site, onboarding, and benefit pages. */
export const RENEWAL_IS_ONE_DEADLINE =
  "Your renewal date is only one deadline. Some benefits also require reports between renewals or prompt notice when your circumstances change. Bene-Watch helps you track each obligation separately.";

/** Same sentence, kept under the name older pages import. */
export const OBLIGATION_EXPLANATION = RENEWAL_IS_ONE_DEADLINE;

export const TRACKING_SCOPE =
  "Bene-Watch helps families track renewals, interim reports, reportable changes, disability and eligibility reviews, and requests for proof.";

// ---------------------------------------------------------------------------
// Obligation categories
// ---------------------------------------------------------------------------

export type ObligationCategory =
  | "renewal_review"
  | "interim_report"
  | "change_report"
  | "document_request"
  | "other";

export const OBLIGATION_CATEGORY_LABEL: Record<ObligationCategory, string> = {
  renewal_review: "Next renewal or review",
  interim_report: "Next interim report",
  change_report: "Changes you must report",
  document_request: "Documents requested",
  other: "Other dates",
};

export function obligationCategoryForKind(kind: string | null | undefined): ObligationCategory {
  switch (kind) {
    case "renewal":
    case "redetermination":
    case "cdr":
    case "assessment":
      return "renewal_review";
    case "sar":
      return "interim_report";
    case "deadline":
    case "change_report":
      return "change_report";
    case "verification":
      return "document_request";
    default:
      return "other";
  }
}

// ---------------------------------------------------------------------------
// Program rules (Pennsylvania + federal)
// ---------------------------------------------------------------------------

export type RuleSource = {
  label: string;
  url: string;
  /** Effective date of the rule as published, when the source states one. */
  effective: string | null;
  /** Date this source was last checked by the team. */
  checkedOn: string;
  /** True when sources disagree or the PA handbook still has to be checked. */
  needsConfirmation?: boolean;
};

export type ReviewRule = {
  /** Deadline kind the review is stored as on the calendar. */
  kind: "renewal" | "redetermination" | "cdr" | "assessment";
  label: string;
  /** Plain-language frequency. Never used to compute a confirmed date. */
  frequency: string;
};

export type InterimRule = {
  label: string;
  frequency: string;
};

export type ProgramObligationRule = {
  code: string;
  /** Each review is a separate obligation (e.g. SSI financial vs. disability). */
  reviews: ReviewRule[];
  /** Scheduled report between renewals, or null if the program has none. */
  interim: InterimRule | null;
  changeReporting: { deadline: string; what: string };
  /** Where one benefit establishes or affects another's eligibility or renewal. */
  linked: string[];
  sources: RuleSource[];
};

const CHECKED = "2026-10-15";

const SSA_REDETS: RuleSource = {
  label: "SSA — SSI redeterminations",
  url: "https://www.ssa.gov/ssi/text-redets-ussi.htm",
  effective: null,
  checkedOn: CHECKED,
};
const SSA_CDR: RuleSource = {
  label: "SSA — Continuing disability reviews",
  url: "https://www.ssa.gov/ssi/text-cdrs-ussi.htm",
  effective: null,
  checkedOn: CHECKED,
};
const SSA_SSI_REPORT: RuleSource = {
  label: "SSA — Reporting responsibilities for SSI",
  url: "https://www.ssa.gov/ssi/text-report-ussi.htm",
  effective: null,
  checkedOn: CHECKED,
};
const SSA_DI_REPORT: RuleSource = {
  label: "SSA — Report changes that affect disability benefits",
  url: "https://www.ssa.gov/manage-benefits/report-changes-affect-disability-benefits",
  effective: null,
  checkedOn: CHECKED,
};
const PA_MA_HANDBOOK: RuleSource = {
  label: "PA DHS — Medical Assistance Eligibility Handbook",
  url: "http://services.dpw.state.pa.us/oimpolicymanuals/ma/index.htm",
  effective: null,
  checkedOn: CHECKED,
};
const PA_SNAP_HANDBOOK: RuleSource = {
  label: "PA DHS — SNAP Handbook (reporting and certification)",
  url: "http://services.dpw.state.pa.us/oimpolicymanuals/snap/index.htm",
  effective: null,
  checkedOn: CHECKED,
  needsConfirmation: true,
};
const FNS_ESAP: RuleSource = {
  label: "USDA FNS — Elderly Simplified Application Project",
  url: "https://www.fns.usda.gov/snap/elderly-simplified-application-project",
  effective: null,
  checkedOn: CHECKED,
};
const SSA_EXTRA_HELP: RuleSource = {
  label: "SSA — Extra Help with Medicare prescription drug costs",
  url: "https://www.ssa.gov/medicare/part-d-extra-help",
  effective: "2026-01-01",
  checkedOn: CHECKED,
};

const CDR_SCHEDULE =
  "Medical improvement expected: first review generally 6–18 months after disability began. Improvement possible: about every 3 years. Improvement not expected: about every 5–7 years. SSA mails the review.";

const PA_TEN_DAY = "Within 10 days of the change";

const MEDICAID_RENEWAL: ReviewRule = {
  kind: "renewal",
  label: "Medicaid financial renewal",
  frequency: "Usually every 12 months, by the date on the renewal packet.",
};

export const PROGRAM_OBLIGATION_RULES: Record<string, ProgramObligationRule> = {
  SSI: {
    code: "SSI",
    reviews: [
      {
        kind: "redetermination",
        label: "SSI financial redetermination",
        frequency:
          "Usually every 1–6 years. Reviews income, resources, and living arrangements. This is separate from the disability review.",
      },
      { kind: "cdr", label: "Disability review (CDR)", frequency: CDR_SCHEDULE },
    ],
    interim: {
      label: "Monthly wage report (only if working)",
      frequency: "Last month's gross wages, by the 6th of each month.",
    },
    changeReporting: {
      deadline: "By the 10th of the month after the change",
      what: "Income, resources, living arrangement, household, address, and hospital or institution stays.",
    },
    linked: [
      "SSI generally brings Medicaid with it in Pennsylvania, and it qualifies the person for Extra Help automatically.",
      "Reporting a change to SSA does not report it to the County Assistance Office for SNAP or Medicaid.",
    ],
    sources: [SSA_REDETS, SSA_CDR, SSA_SSI_REPORT],
  },
  SSDI: {
    code: "SSDI",
    reviews: [{ kind: "cdr", label: "Disability review (CDR)", frequency: CDR_SCHEDULE }],
    interim: null,
    changeReporting: {
      deadline: "Report work promptly to Social Security at my Social Security or 1-800-772-1213",
      what: "Starting or stopping work, or a change in hours or pay. There is no form due date. The renewal date is not where you report wages, and Bene-Watch does not send the report.",
    },
    linked: [
      "After 24 months of SSDI, Medicare begins. QMB can then pay Medicare costs, with its own renewal.",
    ],
    sources: [SSA_CDR, SSA_DI_REPORT],
  },
  DAC: {
    code: "DAC",
    reviews: [{ kind: "cdr", label: "Disability review (CDR)", frequency: CDR_SCHEDULE }],
    interim: null,
    changeReporting: {
      deadline: "Report work promptly to Social Security at my Social Security or 1-800-772-1213",
      what: "Work, earnings, address, and marriage. Marriage can end DAC. There is no form due date. The renewal date is not where you report this.",
    },
    linked: ["A DAC benefit is left out of the Pennsylvania waiver income test."],
    sources: [SSA_CDR, SSA_DI_REPORT],
  },
  MEDICAID: {
    code: "MEDICAID",
    reviews: [MEDICAID_RENEWAL],
    interim: null,
    changeReporting: {
      deadline: PA_TEN_DAY,
      what: "Income, resources, household, address, and other health coverage.",
    },
    linked: ["When Medicaid comes through SSI, the SSA financial redetermination matters too."],
    sources: [PA_MA_HANDBOOK],
  },
  MEDICAIDABD: {
    code: "MEDICAIDABD",
    reviews: [MEDICAID_RENEWAL],
    interim: null,
    changeReporting: {
      deadline: PA_TEN_DAY,
      what: "Income, resources, household, address, and other health coverage.",
    },
    linked: ["When Medicaid comes through SSI, the SSA financial redetermination matters too."],
    sources: [PA_MA_HANDBOOK],
  },
  MEDICAIDMAGI: {
    code: "MEDICAIDMAGI",
    reviews: [MEDICAID_RENEWAL],
    interim: null,
    changeReporting: {
      deadline: PA_TEN_DAY,
      what: "Income, household size, address, and other health coverage. No asset test.",
    },
    linked: [],
    sources: [PA_MA_HANDBOOK],
  },
  MEDICAIDWAIVER: {
    code: "MEDICAIDWAIVER",
    reviews: [
      MEDICAID_RENEWAL,
      {
        kind: "assessment",
        label: "Waiver service and functional review",
        frequency:
          "Level-of-care and service-plan review, usually yearly, scheduled by the waiver program or supports coordinator. Separate from the financial renewal.",
      },
    ],
    interim: null,
    changeReporting: {
      deadline: PA_TEN_DAY,
      what: "Income, resources, employment, household, and changes in care needs.",
    },
    linked: [
      "Finishing the Medicaid financial renewal does not complete the waiver service review, and the reverse is also true.",
    ],
    sources: [PA_MA_HANDBOOK],
  },
  MAWD: {
    code: "MAWD",
    reviews: [MEDICAID_RENEWAL],
    interim: null,
    changeReporting: {
      deadline: PA_TEN_DAY,
      what: "Income, resources, and job changes, including stopping paid work.",
    },
    linked: ["The monthly premium is a separate clock from the renewal."],
    sources: [PA_MA_HANDBOOK],
  },
  QMB: {
    code: "QMB",
    reviews: [
      {
        kind: "renewal",
        label: "QMB renewal",
        frequency: "Usually every 12 months. Separate from a full Medicaid renewal.",
      },
    ],
    interim: null,
    changeReporting: { deadline: PA_TEN_DAY, what: "Income and resources." },
    linked: ["QMB qualifies the person for Extra Help automatically."],
    sources: [PA_MA_HANDBOOK],
  },
  EXTRAHELP: {
    code: "EXTRAHELP",
    reviews: [
      {
        kind: "redetermination",
        label: "Extra Help review",
        frequency:
          "SSA may mail a review form. People who get it automatically through Medicaid, QMB, or SSI are re-checked each year; watch for a fall notice if that status ends.",
      },
    ],
    interim: null,
    changeReporting: {
      deadline: "By the 10th of the month after the change",
      what: "Income, resources, household, and marital status.",
    },
    linked: ["Medicaid, QMB, or SSI establishes Extra Help automatically."],
    sources: [SSA_EXTRA_HELP],
  },
  SNAP: {
    code: "SNAP",
    reviews: [
      {
        kind: "renewal",
        label: "SNAP recertification",
        frequency: "Length depends on the household's reporting category (12, 24, or 36 months).",
      },
    ],
    interim: {
      label: "Semi-annual report (SAR, PA 564)",
      frequency: "Depends on the household's reporting category — see below.",
    },
    changeReporting: {
      deadline: "Within 10 days of the trigger",
      what: "Simplified reporting: gross income above 130% FPL, ABAWD hours below 80 a month, or gambling winnings of $4,750 or more.",
    },
    linked: ["Reporting to SNAP does not report the change to SSA."],
    sources: [PA_SNAP_HANDBOOK, FNS_ESAP],
  },
};

export function obligationRuleFor(program: string): ProgramObligationRule | null {
  return PROGRAM_OBLIGATION_RULES[programCodeKey(program)] ?? null;
}

// ---------------------------------------------------------------------------
// SNAP reporting categories
// ---------------------------------------------------------------------------

export const SNAP_REPORTING_CATEGORIES = [
  "unknown",
  "sar",
  "elderly_disabled_earned",
  "esap",
] as const;
export type SnapReportingCategory = (typeof SNAP_REPORTING_CATEGORIES)[number];

export function isSnapReportingCategory(value: unknown): value is SnapReportingCategory {
  return (
    typeof value === "string" && (SNAP_REPORTING_CATEGORIES as readonly string[]).includes(value)
  );
}

/** Alias used by the limits cards and the limits hub. */
export function isSnapCategory(value: unknown): value is SnapReportingCategory {
  return isSnapReportingCategory(value);
}

export type SnapCategoryRule = {
  label: string;
  who: string;
  certificationMonths: number | null;
  /** True / false when known; null when the rule still needs confirmation. */
  interimReportRequired: boolean | null;
  interimNote: string;
  needsConfirmation: boolean;
};

export const SNAP_CATEGORY_RULES: Record<SnapReportingCategory, SnapCategoryRule> = {
  unknown: {
    label: "Not sure yet",
    who: "Check the approval notice for the certification period and whether a SAR is due.",
    certificationMonths: null,
    interimReportRequired: null,
    interimNote:
      "Do not assume a twice-yearly report or an exemption. Disability alone does not exempt a household from reporting.",
    needsConfirmation: true,
  },
  sar: {
    label: "Simplified reporting (SAR)",
    who: "Most households.",
    certificationMonths: 12,
    interimReportRequired: true,
    interimNote: "A semi-annual report is due around month 6, by the date printed on the form.",
    needsConfirmation: false,
  },
  elderly_disabled_earned: {
    label: "Elderly or disabled, with earned income",
    who: "Every adult is 60+ or has a disability, and someone in the household works.",
    certificationMonths: 24,
    interimReportRequired: true,
    interimNote:
      "24-month certification. Semi-annual reports still arrive between recertifications. Confirm the exact SAR months on the notice.",
    needsConfirmation: true,
  },
  esap: {
    label: "ESAP (elderly or disabled, no earned income)",
    who: "Every member is 60+ or has a disability, and nobody has earned income.",
    certificationMonths: 36,
    interimReportRequired: null,
    interimNote:
      "36-month certification under the Elderly Simplified Application Project. Whether a mid-period report is required has not been confirmed — follow the notice.",
    needsConfirmation: true,
  },
};

// ---------------------------------------------------------------------------
// Per-program obligation summary
// ---------------------------------------------------------------------------

export type ObligationRow = {
  id: string;
  program: string | null;
  /** YYYY-MM-DD */
  dueDate: string;
  kind: string;
  title: string;
  confidence: DateConfidence;
  sourceNote?: string | null;
  hasSourceDocument?: boolean;
  completedAt?: string | null;
};

export type ProgramObligations = {
  code: string;
  rule: ProgramObligationRule | null;
  nextRenewal: ObligationRow | null;
  nextInterim: ObligationRow | null;
  /** True / false when known, null when it depends on an unconfirmed category. */
  interimExpected: boolean | null;
  changeReportsDue: ObligationRow[];
  documentsDue: ObligationRow[];
  /** Earliest open obligation of any kind for this program. */
  earliest: ObligationRow | null;
  /** True when something other than a renewal or review is due before it. */
  earlierThanRenewal: boolean;
  /** Notice dates that disagree with an expected date for the same obligation. */
  discrepancies: string[];
};

function byDate(a: ObligationRow, b: ObligationRow): number {
  return a.dueDate.localeCompare(b.dueDate);
}

/** Open (not completed) rows sorted by due date. Overdue rows stay visible. */
export function openObligations(rows: ObligationRow[]): ObligationRow[] {
  return rows.filter((r) => !r.completedAt).slice().sort(byDate);
}

/**
 * The earliest open obligation of any kind. A renewal is never preferred over
 * an earlier interim report, change report, or document request.
 */
export function nextOpenObligation(rows: ObligationRow[]): ObligationRow | null {
  return openObligations(rows)[0] ?? null;
}

function interimExpectedFor(code: string, snapCategory: SnapReportingCategory | null): boolean | null {
  if (code === "SNAP") return SNAP_CATEGORY_RULES[snapCategory ?? "unknown"].interimReportRequired;
  const rule = PROGRAM_OBLIGATION_RULES[code];
  if (!rule) return null;
  // SSI's wage report only applies when someone works; treat it as conditional.
  if (code === "SSI") return null;
  return rule.interim != null;
}

function findDiscrepancies(rows: ObligationRow[]): string[] {
  const out: string[] = [];
  const byKind = new Map<string, ObligationRow[]>();
  for (const r of rows) {
    const list = byKind.get(r.kind) ?? [];
    list.push(r);
    byKind.set(r.kind, list);
  }
  for (const list of byKind.values()) {
    const confirmed = list.filter((r) => r.confidence === "confirmed");
    const expected = list.filter((r) => r.confidence !== "confirmed");
    for (const c of confirmed) {
      for (const e of expected) {
        if (e.dueDate !== c.dueDate) {
          out.push(
            `${c.title}: the notice says ${c.dueDate}, but ${e.dueDate} was expected. Confirm with the agency — the notice date stays on your calendar.`,
          );
        }
      }
    }
  }
  return out;
}

export function summarizeProgramObligations(
  program: string,
  rows: ObligationRow[],
  opts: { snapCategory?: SnapReportingCategory | null } = {},
): ProgramObligations {
  const code = programCodeKey(program);
  const mine = openObligations(rows.filter((r) => r.program && programCodeKey(r.program) === code));
  const inCategory = (c: ObligationCategory) =>
    mine.filter((r) => obligationCategoryForKind(r.kind) === c);

  const nextRenewal = inCategory("renewal_review")[0] ?? null;
  const nextInterim = inCategory("interim_report")[0] ?? null;
  const earliest = mine[0] ?? null;

  return {
    code,
    rule: obligationRuleFor(code),
    nextRenewal,
    nextInterim,
    interimExpected: nextInterim ? true : interimExpectedFor(code, opts.snapCategory ?? null),
    changeReportsDue: inCategory("change_report"),
    documentsDue: inCategory("document_request"),
    earliest,
    earlierThanRenewal: Boolean(
      earliest &&
        nextRenewal &&
        earliest.id !== nextRenewal.id &&
        obligationCategoryForKind(earliest.kind) !== "renewal_review" &&
        earliest.dueDate < nextRenewal.dueDate,
    ),
    discrepancies: findDiscrepancies(mine),
  };
}

/**
 * For a change that may affect several programs, each program's own reporting
 * requirement. Reporting to one agency never counts as reporting to another.
 */
export function changeReportingByProgram(
  programs: string[],
): { code: string; deadline: string; what: string }[] {
  const seen = new Set<string>();
  const out: { code: string; deadline: string; what: string }[] = [];
  for (const p of programs) {
    const code = programCodeKey(p);
    if (seen.has(code)) continue;
    seen.add(code);
    const rule = PROGRAM_OBLIGATION_RULES[code];
    if (rule) out.push({ code, ...rule.changeReporting });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Completion stages
// ---------------------------------------------------------------------------

export const OBLIGATION_STAGES = ["prepared", "submitted", "proof", "acknowledged"] as const;
export type ObligationStage = (typeof OBLIGATION_STAGES)[number];

export const OBLIGATION_STAGE_LABEL: Record<ObligationStage, string> = {
  prepared: "Prepared",
  submitted: "Submitted",
  proof: "Proof of submission saved",
  acknowledged: "Agency acknowledged",
};

export type StageState = {
  preparedAt?: string | null;
  submittedAt?: string | null;
  proofDocumentId?: string | null;
  acknowledgedAt?: string | null;
  followUp?: string | null;
};

export function stageDone(stage: ObligationStage, s: StageState): boolean {
  switch (stage) {
    case "prepared":
      return Boolean(s.preparedAt);
    case "submitted":
      return Boolean(s.submittedAt);
    case "proof":
      return Boolean(s.proofDocumentId);
    case "acknowledged":
      return Boolean(s.acknowledgedAt);
  }
}

/** A saved reporting deadline, shaped the way the limits cards receive it. */
export type StoredObligation = {
  id: string;
  program: string | null;
  dueDate: string;
  kind: string;
  title: string;
  sourceKey?: string | null;
  confidence?: DateConfidence | null;
  noticeRef?: string | null;
  discrepancy?: string | null;
  completed?: boolean;
};

export type CardObligationLine = {
  label: string;
  value: string;
  sooner: boolean;
};

function formatObligationDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function datedObligation(noun: string, row: ObligationRow | null): string {
  if (!row) return "";
  return `${noun} · ${formatObligationDay(row.dueDate)} · ${DATE_CONFIDENCE_LABEL[row.confidence]}.`;
}

function interimFallback(code: string, snapCategory: SnapReportingCategory | null): string {
  if (code === "SNAP") return SNAP_CATEGORY_RULES[snapCategory ?? "unknown"].interimNote;
  const interim = obligationRuleFor(code)?.interim;
  if (interim) return `${interim.label}. ${interim.frequency}`;
  return "No report between renewals for this program.";
}

/**
 * Four short lines for one program card: renewal, interim report, change
 * reporting, and document requests. Dates come only from saved obligations.
 */
export function obligationsForProgram(input: {
  program: string;
  snapCategory?: SnapReportingCategory | null;
  stored: StoredObligation[];
  enrolledPrograms?: string[];
}): { lines: CardObligationLine[] } {
  const code = programCodeKey(input.program);
  const rows: ObligationRow[] = input.stored
    .filter((row) => !row.completed)
    .map((row) => ({
      id: row.id,
      program: row.program,
      dueDate: row.dueDate.slice(0, 10),
      kind: row.kind,
      title: row.title,
      confidence: normalizeConfidence(row.confidence),
      sourceNote: row.noticeRef ?? row.discrepancy ?? null,
      completedAt: null,
    }));
  const view = summarizeProgramObligations(code, rows, {
    snapCategory: input.snapCategory ?? null,
  });
  const rule = view.rule;
  const renewalDate = view.nextRenewal?.dueDate ?? null;
  const interimDate = view.nextInterim?.dueDate ?? null;
  const documentDate = view.documentsDue[0]?.dueDate ?? null;

  return {
    lines: [
      {
        label: OBLIGATION_CATEGORY_LABEL.renewal_review,
        value: view.nextRenewal
          ? datedObligation(
              view.nextRenewal.kind === "cdr" ? "Disability review" : "Renewal",
              view.nextRenewal,
            )
          : "None on file.",
        sooner: false,
      },
      {
        label: OBLIGATION_CATEGORY_LABEL.interim_report,
        value: view.nextInterim
          ? datedObligation("Interim report", view.nextInterim)
          : interimFallback(code, input.snapCategory ?? null),
        sooner: Boolean(interimDate && renewalDate && interimDate < renewalDate),
      },
      {
        label: "Changes you must report and when",
        value: rule
          ? `${rule.changeReporting.deadline}. ${rule.changeReporting.what}`
          : "Check the notice for what this program requires you to report.",
        sooner: false,
      },
      {
        label: OBLIGATION_CATEGORY_LABEL.document_request,
        value: view.documentsDue[0]
          ? datedObligation("Documents", view.documentsDue[0])
          : "None requested.",
        sooner: Boolean(documentDate && renewalDate && documentDate < renewalDate),
      },
    ],
  };
}

export function cardObligationSummaries(view: {
  lines: CardObligationLine[];
}): CardObligationLine[] {
  return view.lines.map((line) => {
    const sentence = line.value.split(/(?<=\.)\s/)[0] ?? line.value;
    const value = sentence.length > 170 ? `${sentence.slice(0, 167)}…` : sentence;
    return { label: line.label, value, sooner: line.sooner };
  });
}

/** One-line status for a single obligation. */
export function stageSummary(s: StageState): string {
  if (s.acknowledgedAt) return s.followUp ? "Acknowledged · follow-up open" : "Acknowledged by the agency";
  if (s.submittedAt) {
    return s.proofDocumentId ? "Submitted · proof saved" : "Submitted · save proof of submission";
  }
  if (s.preparedAt) return "Prepared · not yet submitted";
  return "Not started";
}
