export const DEADLINE_KINDS = [
  "renewal",
  "deadline",
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
  deadline: "Reporting deadline",
  sar: "Semi-annual report",
  appointment: "Appointment",
  interview: "SNAP / DHS interview",
  verification: "Verification due",
  premium: "MAWD premium",
  cdr: "SSA medical review (CDR)",
  assessment: "Waiver reassessment",
  appeal: "Appeal deadline",
  continued_benefits: "Continued benefits",
  other: "Other",
};

export const DEADLINE_KIND_DEFAULT_TITLE: Record<DeadlineKind, string> = {
  renewal: "Renewal due",
  deadline: "Reporting deadline",
  sar: "Semi-annual report due",
  appointment: "Appointment",
  interview: "Interview",
  verification: "Verification due",
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

/** Playbook to attach when opening this clock. */
export function playbookIdForDeadlineKind(kind: string, program?: string | null): string {
  switch (kind) {
    case "renewal":
    case "sar":
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
      return "waiver_income_2982";
    case "appeal":
    case "continued_benefits":
      return "overpayment_unreported_change";
    default:
      if (program?.toUpperCase() === "SNAP") return "snap_gross_200_fpl";
      return "generic_limit";
  }
}
