/**
 * Display + guidance metadata for each benefit program, keyed by the UPPERCASE
 * program code stored on Threshold.program (e.g. "SNAP"). Used by the
 * per-program benefit detail pages and their "Ask AI how to fix" deep-links.
 *
 * Note: Threshold.program is `uppercase: true`, so enrolled programs like
 * "SNAP" are stored as "SNAP". Look up with `programMetaFor()`.
 */
export type ProgramMeta = {
  /** Uppercase code as stored on Threshold.program. */
  code: string;
  /** Short human label, e.g. "SNAP". */
  label: string;
  /** Full program name. */
  fullName: string;
  /** Administering agency / where to confirm. */
  agency: string;
  /** One-sentence plain-language summary. */
  blurb: string;
  /** What the user should report, and how often, in plain language. */
  reporting: string;
  /** Official URL to verify rules. */
  officialUrl: string;
};

const META: Record<string, ProgramMeta> = {
  SSI: {
    code: "SSI",
    label: "SSI",
    fullName: "Supplemental Security Income",
    agency: "Social Security Administration (SSA)",
    blurb:
      "Needs-based federal cash for people who are 65+, blind, or disabled with very limited income and resources.",
    reporting:
      "Report income, resource, living-arrangement, and household changes by the 10th of the month after the change. SSI recipients must also generally report monthly wages.",
    officialUrl: "https://www.ssa.gov/ssi/",
  },
  SSDI: {
    code: "SSDI",
    label: "SSDI",
    fullName: "Social Security Disability Insurance",
    agency: "Social Security Administration (SSA)",
    blurb:
      "An insurance benefit you earned through work. No income or asset limit to receive it — earnings limits (SGA, TWP) govern whether you're still considered disabled.",
    reporting:
      "Report any work start/stop, wage changes, and changes in your condition. There's no asset test.",
    officialUrl: "https://www.ssa.gov/disability/",
  },
  SNAP: {
    code: "SNAP",
    label: "SNAP",
    fullName: "Supplemental Nutrition Assistance Program (PA ACCESS Card)",
    agency: "PA Department of Human Services (via COMPASS)",
    blurb:
      "Food assistance. PA uses Broad-Based Categorical Eligibility — a 200% FPL gross-income limit and no asset test for most households.",
    reporting:
      "Report changes that push you over limits. Semi-Annual Reporting (SAR) every 6 months and annual recertification.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx",
  },
  MEDICAID: {
    code: "MEDICAID",
    label: "Medicaid",
    fullName: "Pennsylvania Medical Assistance (legacy combined category)",
    agency: "PA Department of Human Services",
    blurb:
      "Older combined Medicaid enrollment. Prefer the specific category: ABD, MAGI, HCBS Waiver, MAWD, or QMB.",
    reporting:
      "Report income, resource, household, and work changes to PA DHS within 10 days.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  MEDICAIDABD: {
    code: "MEDICAIDABD",
    label: "ABD Medicaid",
    fullName: "ABD / Healthy Horizons Medicaid (Aged, Blind, or Disabled)",
    agency: "PA Department of Human Services",
    blurb:
      "Full Medical Assistance for aged, blind, or disabled adults. SSI-related counting; 2026 single income limit $1,330/month and $2,000 countable resources ($8,000 if Medicaid was entered through a waiver).",
    reporting:
      "Report income, assets, household, work, and disability/care-need changes to COMPASS/CAO within 10 days. Annual renewal packet.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  MEDICAIDMAGI: {
    code: "MEDICAIDMAGI",
    label: "MAGI Medicaid",
    fullName: "MAGI Medicaid (expansion adults 19–64 and MAGI families)",
    agency: "PA Department of Human Services",
    blurb:
      "ACA-expansion / MAGI Medical Assistance. Income is tested with MAGI rules (about 138% FPL). No asset test for children, pregnant people, parents, or expansion adults.",
    reporting:
      "Report income, household, address, and other-coverage changes within 10 days. MAGI categories do not have an asset test.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  MEDICAIDWAIVER: {
    code: "MEDICAIDWAIVER",
    label: "HCBS / CHC Waiver",
    fullName: "Pennsylvania HCBS / Community HealthChoices Waiver",
    agency: "PA Department of Human Services",
    blurb:
      "Home- and community-based waiver (including CHC). 2026 income limit $2,982/month (300% of SSI FBR) and $8,000 assets. SSDI and wages count; DAC is excluded in Pennsylvania (1634). Approval confers full Medicaid (deemed eligible).",
    reporting:
      "Report income, asset, employment, household, and care-need changes within 10 days.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  MAWD: {
    code: "MAWD",
    label: "MAWD",
    fullName: "Medical Assistance for Workers with Disabilities",
    agency: "PA Department of Human Services",
    blurb:
      "Medicaid for a Pennsylvania worker with a disability (generally age 16–64 with paid employment). Countable-income limit $3,325/month (250% FPL); $10,000 resources. Premium is usually 5% of countable income. Workers with Job Success can extend coverage up to 600% FPL.",
    reporting:
      "Report income, resource, and employment changes to PA DHS within 10 days. Paid employment is required.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  QMB: {
    code: "QMB",
    label: "QMB",
    fullName: "Qualified Medicare Beneficiary (Healthy Horizons MSP)",
    agency: "PA Department of Human Services",
    blurb:
      "Medicare Savings Program that pays Medicare Part A/B premiums and cost-sharing. Separate from full Medicaid. 2025–2026 single income about $1,350/month (100% FPL + $20) and resources about $9,660.",
    reporting:
      "Report income and resource changes within 10 days. Waiver enrollment does not block QMB.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  EXTRAHELP: {
    code: "EXTRAHELP",
    label: "Extra Help",
    fullName: "Medicare Part D Extra Help (Low-Income Subsidy)",
    agency: "Social Security Administration",
    blurb:
      "Helps pay Medicare Part D prescription costs. 2026 single limits: $2,015/month income ($24,180/year) and $18,090 resources. SSDI, DAC, and wages all count. Automatic if you have Medicaid, QMB, or SSI.",
    reporting:
      "Report income, resource, marital-status, address, and household changes to SSA by the 10th of the month after the change.",
    officialUrl: "https://www.ssa.gov/medicare/part-d-extra-help",
  },
  TANF: {
    code: "TANF",
    label: "TANF",
    fullName: "Temporary Assistance for Needy Families (PA cash assistance)",
    agency: "PA County Assistance Office (via COMPASS)",
    blurb:
      "Temporary cash for low-income families with a minor child (or a pregnant person). Benefit levels are tiered by geographic group; there's a 60-month lifetime limit.",
    reporting:
      "Report income and household changes; periodic 6-month redetermination.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Cash-Assistance.aspx",
  },
  WIC: {
    code: "WIC",
    label: "WIC",
    fullName: "Women, Infants & Children",
    agency: "PA Department of Health",
    blurb:
      "Nutrition assistance and healthy-food packages for pregnant/postpartum/breastfeeding people, infants, and children up to age 5 at nutritional risk. Income limit 185% FPL.",
    reporting:
      "Income and category are re-checked at certification periods (typically every 6–12 months). Getting SNAP, Medicaid, or TANF meets the income test automatically.",
    officialUrl: "https://www.pawic.com/",
  },
  LIHEAP: {
    code: "LIHEAP",
    label: "LIHEAP",
    fullName: "Low-Income Home Energy Assistance Program",
    agency: "PA Department of Human Services",
    blurb:
      "Helps pay heating costs through Cash and Crisis components. Income limit 150% FPL (200% for Weatherization).",
    reporting:
      "One-time seasonal application (Nov–March) with proof of income, ID, residency, and recent utility bills.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/LIHEAP.aspx",
  },
  ACA: {
    code: "ACA",
    label: "ACA / Pennie",
    fullName: "ACA Marketplace premium tax credits (Pennie)",
    agency: "Pennie (Pennsylvania's exchange)",
    blurb:
      "Marketplace health coverage with premium tax credits. For 2026 the 400%-FPL subsidy cliff is back — one dollar over and the subsidy is $0.",
    reporting:
      "Report income and household changes to Pennie within ~30 days to keep advance credits accurate and avoid tax-time repayment.",
    officialUrl: "https://www.pennie.com/",
  },
  VA: {
    code: "VA",
    label: "VA",
    fullName: "VA benefits (disability compensation & pension)",
    agency: "U.S. Department of Veterans Affairs",
    blurb:
      "Two different programs: disability compensation (service-connected, no income/asset limit) and Veterans Pension (needs-based, with income and net-worth limits).",
    reporting:
      "Pension: report income, net worth, dependency, and medical-expense changes. Compensation: COLA is automatic; report dependents and direct deposit.",
    officialUrl: "https://www.va.gov/",
  },
  ABLE: {
    code: "ABLE",
    label: "ABLE",
    fullName: "Achieving a Better Life Experience accounts",
    agency: "PA ABLE Savings Program",
    blurb:
      "Tax-advantaged savings for people with disabilities that doesn't blow up means-tested benefits. The first $100,000 is excluded from SSI's resource limit.",
    reporting:
      "Annual disability recertification (if qualified via certification). Spend housing withdrawals in the same calendar month.",
    officialUrl: "https://www.paable.gov/",
  },
};

/** Normalize an enrolled program code (any case) to its UPPERCASE storage key. */
export function programCodeKey(program: string): string {
  return String(program ?? "").trim().toUpperCase();
}

/** Metadata for a program code (any case). Returns null if unknown. */
export function programMetaFor(program: string): ProgramMeta | null {
  return META[programCodeKey(program)] ?? null;
}

/** Friendly label for a program code, falling back to the raw code. */
export function programLabel(program: string): string {
  return programMetaFor(program)?.label ?? String(program ?? "");
}
