/**
 * 2026–2027 policy changes described in the market-strategy deck.
 * `verified` stays false until product/legal confirm Pennsylvania implementation,
 * effective date, waivers, and notice language. The screen may still compute a
 * hypothetical result labeled "if this rule applied."
 */

export type PolicyRuleId =
  | "snap_work_expansion"
  | "magi_work_80h"
  | "magi_semiannual"
  | "immigrant_restrictions_2026";

export type PolicyRule = {
  id: PolicyRuleId;
  program: "SNAP" | "MedicaidMAGI";
  title: string;
  /** ISO date the deck describes — not used as law until verified. */
  proposedEffective: string;
  verified: boolean;
  sourceNote: string;
};

export const POLICY_RULES: Record<PolicyRuleId, PolicyRule> = {
  snap_work_expansion: {
    id: "snap_work_expansion",
    program: "SNAP",
    title: "Expanded SNAP work / time-limit rules",
    proposedEffective: "2025-11-01",
    verified: false,
    sourceNote:
      "The deck describes late-2025 expansion to older adults up to age 65, caregivers of children 14+, and removal of veteran and former foster-youth exemptions. Confirm PA’s effective date, waivers, and age cutoffs before treating anyone as noncompliant.",
  },
  magi_work_80h: {
    id: "magi_work_80h",
    program: "MedicaidMAGI",
    title: "MAGI Medicaid 80-hour work reporting",
    proposedEffective: "2027-01-01",
    verified: false,
    sourceNote:
      "Projected January 1, 2027 for expansion adults 19–64. Hours, qualifying activity, exemptions, and lockout rules must be verified in final CMS/DHS guidance.",
  },
  magi_semiannual: {
    id: "magi_semiannual",
    program: "MedicaidMAGI",
    title: "MAGI semi-annual renewal",
    proposedEffective: "2027-01-01",
    verified: false,
    sourceNote:
      "Projected 2027 shift to 6-month renewals for expansion adults. Disability/waiver categories are described as staying on a different schedule.",
  },
  immigrant_restrictions_2026: {
    id: "immigrant_restrictions_2026",
    program: "MedicaidMAGI",
    title: "Medicaid/SNAP restrictions for many lawfully present immigrants",
    proposedEffective: "2026-10-01",
    verified: false,
    sourceNote:
      "The deck identifies October 2026 category restrictions. Misclassification of status is common. Get the actual notice and qualified immigration + benefits counsel before acting.",
  },
};

export type RuleGate = "unverified" | "scheduled" | "in_effect";

export function ruleGate(rule: PolicyRule, now: Date = new Date()): RuleGate {
  if (!rule.verified) return "unverified";
  const start = new Date(`${rule.proposedEffective}T00:00:00.000Z`);
  return now.getTime() >= start.getTime() ? "in_effect" : "scheduled";
}

export function gateLabel(gate: RuleGate): string {
  switch (gate) {
    case "unverified":
      return "Not verified as Pennsylvania law yet — do not treat this as a current requirement";
    case "scheduled":
      return "Verified but not yet in effect for this date";
    case "in_effect":
      return "Verified and in effect — still confirm this person’s category and any waiver";
  }
}
