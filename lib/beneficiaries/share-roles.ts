/**
 * Preset "who are you inviting" options for sharing a beneficiary. Each preset
 * pairs a human relationship with an enforced permission tier:
 *   - co_manager → full access (edit programs, limits, files, sharing)
 *   - viewer     → read-only (thresholds, alerts, documents, activity)
 * The `relationship` is a label stored alongside the grant; the `role` is what
 * the access checks actually enforce (see lib/beneficiaries/access.ts).
 */
export const SHARE_RELATIONSHIPS = [
  "family",
  "benefit_manager",
  "accountant",
  "fiduciary",
  "other",
] as const;

export type ShareRelationship = (typeof SHARE_RELATIONSHIPS)[number];

export type SharePreset = {
  id: ShareRelationship;
  label: string;
  role: "co_manager" | "viewer";
  description: string;
};

export const SHARE_PRESETS: SharePreset[] = [
  {
    id: "family",
    label: "Family member",
    role: "co_manager",
    description: "Full access to help manage this person's benefits.",
  },
  {
    id: "benefit_manager",
    label: "Benefit manager",
    role: "co_manager",
    description: "Full access — manage programs, limits, and files.",
  },
  {
    id: "accountant",
    label: "Accountant",
    role: "viewer",
    description: "Read-only — transactions, limits, and exports.",
  },
  {
    id: "fiduciary",
    label: "Fiduciary / trustee",
    role: "co_manager",
    description: "Full access for a representative payee or trustee.",
  },
  {
    id: "other",
    label: "Viewer",
    role: "viewer",
    description: "Read-only access.",
  },
];

export function relationshipLabel(relationship: string): string {
  return SHARE_PRESETS.find((p) => p.id === relationship)?.label ?? "Viewer";
}
