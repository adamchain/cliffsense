/**
 * Display + guidance metadata for each benefit program, keyed by the UPPERCASE
 * program code stored on Threshold.program (e.g. "SECTION8"). Used by the
 * per-program benefit detail pages and their "Ask AI how to fix" deep-links.
 *
 * Note: Threshold.program is `uppercase: true`, so the enrolled program
 * "Section8" is stored as "SECTION8". Look up with `programMetaFor()`.
 */
export type ProgramMeta = {
  /** Uppercase code as stored on Threshold.program. */
  code: string;
  /** Short human label, e.g. "Section 8". */
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
    fullName: "Pennsylvania Medical Assistance (MA)",
    agency: "PA Department of Human Services",
    blurb:
      "Health coverage. MAGI categories have no asset test; non-MAGI (aged/blind/disabled, long-term care) apply an asset test. MAWD lets workers keep Medicaid at higher income.",
    reporting:
      "Report income and household changes; annual renewal / redetermination.",
    officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
  },
  SECTION8: {
    code: "SECTION8",
    label: "Section 8",
    fullName: "Housing Choice Voucher (HCV)",
    agency: "Local Public Housing Authority (HUD)",
    blurb:
      "Rental assistance. Income limits are based on Area Median Income (varies by county). HOTMA sets a net family asset limit.",
    reporting:
      "Report income and household-composition changes; PHA approval needed to add members. Annual recertification and unit inspection.",
    officialUrl: "https://www.hud.gov/program_offices/public_indian_housing/programs/hcv",
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
