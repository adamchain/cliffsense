import { POLICY_RULES, type PolicyRuleId } from "@/lib/policy/rules";

/**
 * Identity of the rule set behind a figure or alert.
 * A result is current only when the stamp is verified and today falls in its
 * effective period. Unverified policy stays visible as a review signal.
 */
export type RuleStamp = {
  program: string;
  pathway: string;
  jurisdiction: "PA";
  effectiveFrom: string;
  effectiveTo: string | null;
  source: string;
  version: string;
  verified: boolean;
};

type StampBody = Omit<RuleStamp, "jurisdiction" | "program">;

const PROGRAM_STAMPS: Record<string, StampBody> = {
  SSI: {
    pathway: "Federal SSI",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "SSA 2026 SSI Federal Benefit Rate and resource limits",
    version: "ssi-2026.1",
    verified: true,
  },
  SSDI: {
    pathway: "Title II work incentives",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "SSA 2026 Trial Work Period and non-blind substantial gainful activity",
    version: "ssdi-work-2026.1",
    verified: true,
  },
  DAC: {
    pathway: "Childhood disability benefits",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "SSA 2026 non-blind substantial gainful activity. DAC has no trial work period.",
    version: "dac-2026.1",
    verified: true,
  },
  MEDICAIDABD: {
    pathway: "Healthy Horizons / ABD Medicaid",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "Pennsylvania 2026 ABD income and resource limits",
    version: "abd-2026.1",
    verified: true,
  },
  MEDICAIDWAIVER: {
    pathway: "Waiver Medicaid",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "Pennsylvania 2026 waiver gross-income and resource limits",
    version: "waiver-2026.1",
    verified: true,
  },
  MAWD: {
    pathway: "Medical Assistance for Workers with Disabilities",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "Pennsylvania 2026 MAWD income and resource limits",
    version: "mawd-2026.1",
    verified: true,
  },
  MEDICAIDMAGI: {
    pathway: "MAGI adult Medicaid",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "2026 HealthChoices adult income limits at 138% of the poverty guideline",
    version: "magi-2026.1",
    verified: true,
  },
  QMB: {
    pathway: "Qualified Medicare Beneficiary",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "2026 QMB income and resource limits",
    version: "qmb-2026.1",
    verified: true,
  },
  EXTRAHELP: {
    pathway: "Medicare Extra Help",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "2026 Extra Help income and resource limits",
    version: "extra-help-2026.1",
    verified: true,
  },
  LIS: {
    pathway: "Medicare Extra Help",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "2026 Extra Help income and resource limits",
    version: "extra-help-2026.1",
    verified: true,
  },
  SNAP: {
    pathway: "SNAP",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "Pennsylvania 2026 SNAP gross-income and elderly-or-disabled resource screens",
    version: "snap-2026.1",
    verified: true,
  },
  ABLE: {
    pathway: "ABLE account and SSI",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    source: "SSI treatment of ABLE balances above $100,000",
    version: "able-ssi-2026.1",
    verified: true,
  },
};

/** Playbooks that describe a projected rule, not a verified current one. */
const UNVERIFIED_PLAYBOOKS: Record<string, PolicyRuleId> = {
  magi_work_requirements_2027: "magi_work_80h",
  magi_semiannual_renewal_2027: "magi_semiannual",
  immigrant_restrictions_2026: "immigrant_restrictions_2026",
  snap_work_exemption_lost: "snap_work_expansion",
};

function programKey(program: string): string {
  return program.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function unspecified(program: string): RuleStamp {
  return {
    program: program || "Unspecified",
    pathway: "Pathway not identified",
    jurisdiction: "PA",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    source: "No versioned rule is on file for this program. Do not treat a figure as current.",
    version: "unversioned",
    verified: false,
  };
}

export function stampForProgram(program: string): RuleStamp {
  const key = programKey(program);
  const body = PROGRAM_STAMPS[key];
  if (!body) return unspecified(program || key || "Unspecified");
  return { program: program || key, jurisdiction: "PA", ...body };
}

export function stampForPlaybook(playbookId: string, program: string): RuleStamp {
  const policyId = UNVERIFIED_PLAYBOOKS[playbookId];
  if (policyId) {
    const rule = POLICY_RULES[policyId];
    return {
      program: program || rule.program,
      pathway: rule.title,
      jurisdiction: "PA",
      effectiveFrom: rule.proposedEffective,
      effectiveTo: null,
      source: rule.sourceNote,
      version: `${rule.id}@unverified`,
      verified: rule.verified,
    };
  }
  return stampForProgram(program);
}

export function isCurrentRule(stamp: RuleStamp, now: Date = new Date()): boolean {
  if (!stamp.verified) return false;
  const from = Date.parse(`${stamp.effectiveFrom}T00:00:00.000Z`);
  const to = stamp.effectiveTo
    ? Date.parse(`${stamp.effectiveTo}T23:59:59.999Z`)
    : Number.POSITIVE_INFINITY;
  if (Number.isNaN(from) || Number.isNaN(to)) return false;
  const t = now.getTime();
  return t >= from && t <= to;
}

export function ruleStatusLine(stamp: RuleStamp, now: Date = new Date()): string {
  if (!stamp.verified) {
    return `${stamp.program} · ${stamp.version} · not verified as current law`;
  }
  if (!isCurrentRule(stamp, now)) {
    return `${stamp.program} · ${stamp.version} · outside its effective period`;
  }
  const end = stamp.effectiveTo ?? "open";
  return `${stamp.program} · ${stamp.version} · in effect ${stamp.effectiveFrom} to ${end}`;
}
