import type { ApplicationRelationship, ApplicationEvent } from "@/lib/db/models/Application";

/** Human labels for the acting-for relationship. */
export const RELATIONSHIP_LABELS: Record<ApplicationRelationship, string> = {
  representative_payee: "Representative Payee (SSA)",
  power_of_attorney: "Power of Attorney (financial)",
  family_caregiver: "Family caregiver",
  nonprofit_caseworker: "Nonprofit caseworker",
  other: "Other",
};

/** Past-tense summaries for timeline events. */
export const EVENT_LABELS: Record<ApplicationEvent, string> = {
  submitted: "Application submitted",
  document_uploaded: "Document uploaded",
  info_requested: "More information requested",
  approved: "Application approved",
  rejected: "Application not approved",
};

/** The two accepted authorization documents (client-safe — no model import). */
export const DOC_TYPE_OPTIONS = [
  { value: "rep_payee_letter", label: "Representative Payee letter (SSA)" },
  { value: "poa_financial", label: "Power of Attorney (financial affairs)" },
] as const;

/** Relationship choices for the acting-for form. */
export const RELATIONSHIP_OPTIONS = [
  { value: "representative_payee", label: "Representative Payee (SSA)" },
  { value: "power_of_attorney", label: "Power of Attorney (financial)" },
  { value: "family_caregiver", label: "Family caregiver" },
  { value: "nonprofit_caseworker", label: "Nonprofit caseworker" },
  { value: "other", label: "Other" },
] as const;

export function relationshipLabel(value: string): string {
  return RELATIONSHIP_LABELS[value as ApplicationRelationship] ?? value;
}

export function eventLabel(value: string): string {
  return EVENT_LABELS[value as ApplicationEvent] ?? value;
}
