export const DEADLINE_KINDS = [
  "renewal",
  "redetermination",
  "deadline",
  "change_report",
  "sar",
  "appointment",
  "interview",
  "verification",
  "premium",
  "cdr",
  "assessment",
  "appeal",
  "continued_benefits",
  "other",
] as const;

export type DeadlineKind = (typeof DEADLINE_KINDS)[number];

export const CASE_CLOCK_KINDS: DeadlineKind[] = [
  "interview",
  "verification",
  "premium",
  "cdr",
  "assessment",
  "appeal",
  "continued_benefits",
];

export const DEADLINE_KIND_LABEL: Record<DeadlineKind, string> = {
  renewal: "Renewal",
  redetermination: "Financial redetermination",
  deadline: "Reporting deadline",
  change_report: "Change report",
  sar: "Interim report (SAR)",
  appointment: "Appointment",
  interview: "SNAP / DHS interview",
  verification: "Documents requested",
  premium: "MAWD premium",
  cdr: "SSA medical review (CDR)",
  assessment: "Waiver reassessment",
  appeal: "Appeal deadline",
  continued_benefits: "Continued benefits",
  other: "Other",
};

export const DEADLINE_KIND_DEFAULT_TITLE: Record<DeadlineKind, string> = {
  renewal: "Renewal due",
  redetermination: "Financial redetermination due",
  deadline: "Reporting deadline",
  change_report: "Report a change",
  sar: "Interim report due",
  appointment: "Appointment",
  interview: "Interview",
  verification: "Documents requested by the agency",
  premium: "MAWD premium due",
  cdr: "Continuing disability review due",
  assessment: "Waiver functional reassessment",
  appeal: "Appeal deadline",
  continued_benefits: "Request continued benefits by",
  other: "Deadline",
};

export function isDeadlineKind(value: string | null | undefined): value is DeadlineKind {
  return Boolean(value && (DEADLINE_KINDS as readonly string[]).includes(value));
}

export function isCaseClockKind(kind: string | null | undefined): boolean {
  return CASE_CLOCK_KINDS.includes(kind as DeadlineKind);
}

/** Playbook to attach when opening this clock. The plan follows this event's program. */
export function playbookIdForDeadlineKind(kind: string, program?: string | null): string {
  const programKey = (program ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (programKey === "QMB") {
    if (kind === "appeal" || kind === "continued_benefits") return "appeal_continued_benefits";
    return "qmb_income_resources";
  }
  switch (kind) {
    case "renewal":
    case "redetermination":
    case "sar":
      if (programKey === "SNAP") return "snap_sar_renewal";
      if (programKey === "MEDICAIDWAIVER") return "waiver_income_2982";
      return "medicaid_renewal_packet";
    case "interview":
      return "snap_interview";
    case "verification":
      return "verification_request";
    case "premium":
      return "mawd_transition";
    case "cdr":
      return "ssdi_medical_improvement";
    case "assessment":
      return programKey === "MEDICAIDWAIVER" || !programKey ? "waiver_income_2982" : "calendar_notice";
    case "appeal":
    case "continued_benefits":
      return "appeal_continued_benefits";
    default:
      return "calendar_notice";
  }
}
