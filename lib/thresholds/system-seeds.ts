export type SystemThresholdSeed = {
  systemKey: string;
  program: string;
  state: string | null;
  thresholdType:
    | "monthly_earned_income"
    | "monthly_unearned_income"
    | "annual_income"
    | "asset_balance"
    | "transaction_amount"
    | "custom";
  limitCents: number;
  comparison: "lte" | "lt" | "gte" | "gt";
  warnAtPercent: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  label: string;
  description: string;
  sourceUrl: string;
};

/** Reference figures from core-instructions (2025); verify annually with official sources. */
export const SYSTEM_THRESHOLD_SEEDS: SystemThresholdSeed[] = [
  {
    systemKey: "ssdi_twp_2025",
    program: "SSDI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1160_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    effectiveTo: null,
    label: "SSDI — Trial Work Period (monthly gross earnings reference)",
    description:
      "Reference gross earnings level often used with the Trial Work Period. SSA rules are individual; confirm with SSA or a qualified representative.",
    sourceUrl: "https://www.ssa.gov/oact/cola/sga.html",
  },
  {
    systemKey: "ssi_sga_nonblind_2025",
    program: "SSI",
    state: null,
    thresholdType: "monthly_earned_income",
    limitCents: 1620_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    effectiveTo: null,
    label: "SSI / SSDI — Substantial Gainful Activity (non-blind, monthly reference)",
    description:
      "Federal SGA reference amount for non-blind individuals. SSI countable earned income uses additional exclusions; this is an informational ceiling only.",
    sourceUrl: "https://www.ssa.gov/oact/cola/sga.html",
  },
  {
    systemKey: "ssi_resources_individual_2025",
    program: "SSI",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 2000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    effectiveTo: null,
    label: "SSI — Countable resources (individual, reference)",
    description:
      "Federal countable resource limit for an individual. Not all assets count; verify with SSA.",
    sourceUrl: "https://www.ssa.gov/ssi/text-resources-ussi.htm",
  },
  {
    systemKey: "ssi_resources_couple_2025",
    program: "SSI",
    state: null,
    thresholdType: "asset_balance",
    limitCents: 3000_00,
    comparison: "lte",
    warnAtPercent: 0.85,
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    effectiveTo: null,
    label: "SSI — Countable resources (couple, reference)",
    description: "Federal countable resource limit for a couple. Verify exclusions with SSA.",
    sourceUrl: "https://www.ssa.gov/ssi/text-resources-ussi.htm",
  },
];

export function thresholdSeedToDoc(seed: SystemThresholdSeed): Record<string, unknown> {
  return {
    scope: "system",
    ownerUserId: null,
    beneficiaryId: null,
    systemKey: seed.systemKey,
    program: seed.program,
    state: seed.state,
    thresholdType: seed.thresholdType,
    limitCents: seed.limitCents,
    comparison: seed.comparison,
    warnAtPercent: seed.warnAtPercent,
    effectiveFrom: seed.effectiveFrom,
    effectiveTo: seed.effectiveTo,
    label: seed.label,
    description: seed.description,
    sourceUrl: seed.sourceUrl,
  };
}
