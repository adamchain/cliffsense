import { CLOSURE_CODE_NOTES, personaById } from "@/lib/alerts/eligibility-loss-personas";
import { ELIGIBILITY_LOSS_SCENARIOS } from "@/lib/alerts/eligibility-loss-scenarios";

export type ClosureCode = "042" | "440" | "474";

/** Seven-field intervention attached to a live alert. */
export type AlertPlaybook = {
  id: string;
  title: string;
  /** (1) Threatened program(s). */
  programs: string[];
  /** (2) Triggering rule. */
  triggeringRule: string;
  /** (3) Deadline / effective-date note — not a computed case date unless stated. */
  effectiveDateNote: string;
  /** (4) Action that cures or limits the loss. */
  cureAction: string;
  /** (5) Documents to gather. */
  documents: string[];
  /** (6) Next category or coverage if this one cannot continue. */
  alternativePathway: string;
  /** (7) Appeal and continued-benefit protection. */
  appealNote: string;
  /** Named 6-step plan from the 30-scenario brief, if any. */
  personaId?: string;
  closureCodes?: ClosureCode[];
};

export const REPORT_BY_10TH =
  "Report income, resources, work, household, and address changes by the 10th of the month after the change month, unless a notice states a different deadline.";

export const APPEAL_AND_CONTINUE =
  "If an adverse notice has already issued, appeal by the date on that notice. Request continued cash, medical coverage, or services by any shorter continuation deadline on the same notice — it is often earlier than the appeal deadline. File a new application in parallel if reopening is uncertain.";

export const VERIFY_FUTURE_POLICY =
  "First confirm the rule is in effect for this person, category, and certification period. 2026–2027 policy dates, Pennsylvania waivers, exemptions, and delayed starts must be verified before treating a projected rule as current law.";

export const INFORMATIONAL_ONLY =
  "Informational only — MyBenefitsPA does not determine eligibility. Confirm with SSA, the County Assistance Office, COMPASS, or a qualified benefits counselor.";

const DEFAULT_DOCS = [
  "Current pay stubs or benefit award letters",
  "Bank statements covering the month in question",
  "Any DHS/SSA notice and proof of what was already submitted",
];

function pb(
  id: string,
  title: string,
  programs: string[],
  triggeringRule: string,
  cureAction: string,
  extra: Partial<AlertPlaybook> = {},
): AlertPlaybook {
  return {
    id,
    title,
    programs,
    triggeringRule,
    effectiveDateNote: extra.effectiveDateNote ?? REPORT_BY_10TH,
    cureAction,
    documents: extra.documents ?? DEFAULT_DOCS,
    alternativePathway:
      extra.alternativePathway ??
      "Screen for another Medicaid category (including MAWD or a waiver), a Medicare Savings Program, Marketplace coverage, or SNAP adjustments before the current benefit ends.",
    appealNote: extra.appealNote ?? APPEAL_AND_CONTINUE,
    personaId: extra.personaId,
    closureCodes: extra.closureCodes,
  };
}

/** Playbooks keyed by scenario id (and a few threshold-only ids). */
export const ALERT_PLAYBOOKS: Record<string, AlertPlaybook> = {
  generic_limit: pb(
    "generic_limit",
    "A stored benefit limit needs review",
    [],
    "Linked account activity is near a reference limit stored in MyBenefitsPA.",
    "Open the program page, confirm the figures, and report any real change through SSA or COMPASS/CAO. Do not change work or spending solely on this alert.",
  ),

  ssdi_sga_after_twp: pb(
    "ssdi_sga_after_twp",
    "SSDI cash may stop after the Trial Work Period",
    ["SSDI"],
    "Gross earnings at or above SGA ($1,690/mo non-blind, 2026) after nine TWP months can suspend or end SSDI cash.",
    "Count TWP months from pay stubs, document IRWEs/subsidy, and report work to SSA before treating one high month as a termination.",
    {
      personaId: "anthony_sga_after_twp",
      documents: [
        "Pay stubs for TWP and later months",
        "Employer letter on hours, subsidy, or special conditions",
        "IRWE receipts",
        "SSA work-history / award notices",
      ],
      alternativePathway:
        "Medicare may continue for a statutory period. Recalculate QMB separately. Screen MAWD if Medicaid is at risk.",
    },
  ),

  ssdi_twp_service_month: pb(
    "ssdi_twp_service_month",
    "This month may count as a Trial Work Period month",
    ["SSDI"],
    "Gross earnings at or above the TWP service-month amount ($1,210/mo, 2026) count toward nine TWP months in a rolling 60-month window.",
    "Track TWP months used and report work start, stop, hours, and pay to SSA by the 10th of the next month.",
    { personaId: "maria_earnings_double" },
  ),

  dac_sga_disability: pb(
    "dac_sga_disability",
    "DAC earnings may threaten the disability finding",
    ["DAC"],
    "DAC has no separate wage cap, but earnings above SGA can end the disability finding and stop DAC.",
    "Report work to SSA, keep medical evidence current, and do not assume marriage or wages are ignored.",
  ),

  dac_marriage: pb(
    "dac_marriage",
    "Marriage can end DAC",
    ["DAC"],
    "Marrying someone who is not a Title II beneficiary generally ends DAC.",
    "Report marital-status changes to SSA before relying on DAC continuing. Screen other cash and medical pathways.",
    { personaId: "denise_marriage_deeming" },
  ),

  ssdi_medical_improvement: pb(
    "ssdi_medical_improvement",
    "Medical improvement / continuing disability review",
    ["SSDI", "DAC"],
    "SSA may cease benefits if a CDR finds medical improvement sufficient to work, or if required forms/exams are missed.",
    "Return every CDR form and exam request by the stated deadline. Collect treating-source records covering the review period.",
    {
      personaId: "howard_ssdi_medical_improvement",
      effectiveDateNote:
        "Use the deadlines on the CDR packet and any cessation notice. Continued-payment requests are often due sooner than the appeal.",
      documents: [
        "CDR forms and exam notices",
        "Treatment records for the review period",
        "Clinician statements on work capacity",
        "Prior favorable SSA findings",
      ],
    },
  ),

  ssi_countable_income_fbr: pb(
    "ssi_countable_income_fbr",
    "SSI cash may fall to $0 near the Federal Benefit Rate",
    ["SSI"],
    "When countable income reaches the FBR ($994 individual, 2026), the SSI check can fall to $0. Countable wages use the $20 / $65 / ½ rules.",
    "Project countable income before adding hours. Report wages to SSA. Screen 1619(b), MAWD, or waiver Medicaid before assuming medical coverage ends with the cash check.",
    { personaId: "maria_earnings_double" },
  ),

  ssi_resources_2k: pb(
    "ssi_resources_2k",
    "SSI countable resources may exceed $2,000",
    ["SSI"],
    "Countable resources over $2,000 can suspend SSI. Home, one car, a properly structured SNT, and ABLE are usually excluded; cash in checking generally is not.",
    "Do not give funds away or move them into another person's account. Ask counsel about ABLE or a first-party SNT before the next resource-measurement date. Report the change accurately.",
    {
      personaId: "sophia_inheritance_checking",
      documents: [
        "Statements showing the deposit and later balance",
        "Will, settlement, or gift letter",
        "ABLE or SNT documents if used",
        "Receipts for any same-month exempt purchases",
      ],
    },
  ),

  ssi_snt_cash: pb(
    "ssi_snt_cash",
    "Cash from an SNT is usually countable SSI income",
    ["SSI"],
    "Cash paid from a special needs trust to the beneficiary is unearned income (dollar-for-dollar after the $20 general exclusion).",
    "Stop or reverse a beneficiary-directed cash distribution if still possible. Prefer trustee-to-vendor payments, then calculate any SSI shelter (ISM) effect before paying rent.",
    {
      personaId: "david_snt_rent_cash",
      documents: [
        "Trust distribution record",
        "Bank deposit showing cash received",
        "Vendor/landlord invoice if paying third parties",
        "ABLE documents if a QDE transfer is considered",
      ],
    },
  ),

  ssi_snt_shelter_ism: pb(
    "ssi_snt_shelter_ism",
    "Vendor-paid rent or utilities can reduce SSI (ISM)",
    ["SSI"],
    "Rent, mortgage, property tax, gas, electric, or water paid by an SNT to a vendor is in-kind support, usually capped at the PMV (⅓ FBR + $20).",
    "Budget for the capped reduction. Food, internet, phone, cable, and tuition paid to vendors are generally excluded after the Sept 2024 food rule. Use the SSI SNT estimator on Resources.",
    { personaId: "david_snt_rent_cash" },
  ),

  ssi_able_100k: pb(
    "ssi_able_100k",
    "ABLE cash over $100,000 can suspend SSI cash",
    ["SSI", "ABLE"],
    "SSI cash suspends while ABLE countable cash exceeds $100,000; Medicaid can continue.",
    "Watch ABLE statements. Plan qualified distributions before crossing $100k if the SSI check is needed.",
    { documents: ["ABLE statements", "Distribution records", "Medicaid award letter"] },
  ),

  ssi_age18_redetermination: pb(
    "ssi_age18_redetermination",
    "Age-18 adult disability redetermination",
    ["SSI"],
    "At 18, SSA applies the adult disability standard. Losing SSI can also end SSI-linked Medicaid.",
    "Assemble adult function evidence well before the birthday. Appeal a denial and request continued SSI within any shorter continuation period. Apply for another Medicaid category before J-category coverage ends.",
    {
      personaId: "marcus_age18_cdr",
      documents: [
        "Diagnoses, testing, IEP, and school records",
        "SSA-3373 adult function report",
        "Provider statements on attendance, pace, safety, and supervision",
        "SSA and DHS notices",
      ],
    },
  ),

  ssi_student_exclusion_ends: pb(
    "ssi_student_exclusion_ends",
    "Student earned-income exclusion may no longer apply",
    ["SSI"],
    "The student earned-income exclusion ends when the student turns 22 or leaves school.",
    "Recalculate countable wages without the exclusion. Report school-status changes to SSA.",
  ),

  abd_income_limit: pb(
    "abd_income_limit",
    "ABD / Healthy Horizons income ceiling",
    ["MedicaidABD"],
    "Full ABD Medicaid income for a single adult is about $1,330/mo using SSI-related counting — not MAGI.",
    "Confirm the category with the CAO. If over ABD but under waiver ($2,982) or MAWD ($3,325), ask about a transfer before coverage closes.",
  ),

  abd_resources_2k: pb(
    "abd_resources_2k",
    "ABD Medicaid resource limit",
    ["MedicaidABD"],
    "Standard ABD countable resources are capped near $2,000 ($8,000 if Medicaid entered through a waiver).",
    "Report balance spikes within 10 days. Prefer ABLE/SNT for excess liquid funds. Do not transfer below fair value.",
    { personaId: "sophia_inheritance_checking" },
  ),

  waiver_income_2982: pb(
    "waiver_income_2982",
    "HCBS / CHC waiver income ceiling",
    ["MedicaidWaiver"],
    "2026 waiver income limit is $2,982/mo (300% FBR). Only the applicant's income counts; DAC is often excluded in PA (1634).",
    "Report income via COMPASS/CAO within 10 days. Keep waiver approval and LOC documents. Screen MAWD if wages threaten the ceiling but paid work continues.",
    {
      personaId: "noah_waiver_reassessment",
      documents: [
        "Pay stubs and SSDI letters",
        "Waiver approval / CHC enrollment",
        "Level-of-care or reassessment notices",
      ],
    },
  ),

  ssdi_waiver_twilight: pb(
    "ssdi_waiver_twilight",
    "SSDI cash may end while waiver income is still safe",
    ["SSDI", "MedicaidWaiver"],
    "Earnings can end SSDI cash at SGA while still leaving room under the $2,982 waiver income limit.",
    "Report work to SSA. Ask the CAO about MAWD so medical coverage does not gap if SSDI cash stops.",
    { personaId: "maria_earnings_double" },
  ),

  mawd_transition: pb(
    "mawd_transition",
    "MAWD may keep Medicaid when wages rise — if paid work continues",
    ["MAWD", "MedicaidABD", "MedicaidWaiver"],
    "MAWD allows higher income (250% FPL ≈ $3,325; Job Success up to 600% FPL) but requires paid work and a premium (~5% of countable income). Volunteer work does not qualify.",
    "If wages threaten SSDI or ABD, apply for MAWD before the current category closes. If work is ending, apply for another Medicaid category first — stopping work can end MAWD even when income and resources still fit.",
    {
      personaId: "priya_mawd_stops_work",
      documents: [
        "Proof of paid employment or self-employment",
        "Premium notice and payment receipt",
        "Alternate-category application if work is ending",
      ],
    },
  ),

  magi_work_requirements_2027: pb(
    "magi_work_requirements_2027",
    "MAGI Medicaid work-reporting (projected 2027)",
    ["MedicaidMAGI"],
    "Expansion adults 19–64 may have to show qualifying hours or an exemption, or risk disenrollment.",
    "Do not assume the deck's hours rule is already in force. If it applies, keep a monthly activity file (pay stubs, timesheets, employer letter) and screen exemptions before reporting noncompliance.",
    {
      personaId: "aisha_magi_work_proof",
      effectiveDateNote: VERIFY_FUTURE_POLICY,
      documents: ["Pay stubs and timesheets", "Employer hours letter", "Exemption evidence"],
    },
  ),

  magi_semiannual_renewal_2027: pb(
    "magi_semiannual_renewal_2027",
    "MAGI semi-annual renewal (projected 2027)",
    ["MedicaidMAGI"],
    "MAGI expansion adults may shift to 6-month renewals. Missing a renewal can end coverage even when still eligible.",
    "Track the COMPASS due date, submit the renewal and verifications, then call the CAO to confirm what is still missing.",
    {
      personaId: "elena_medicaid_renewal",
      effectiveDateNote: VERIFY_FUTURE_POLICY,
      closureCodes: ["042"],
    },
  ),

  lucas_magi_income: pb(
    "lucas_magi_income",
    "MAGI Medicaid current monthly income",
    ["MedicaidMAGI"],
    "MAGI expansion uses current monthly household MAGI — not an asset test, and not the same as Marketplace projected annual income.",
    "Report the change, get the expected end date in writing, and use a special enrollment period for Marketplace or employer coverage before Medicaid ends. Screen disability-based Medicaid, MAWD, waiver, CHIP, or pregnancy coverage for the household.",
    { personaId: "lucas_magi_income" },
  ),

  qmb_income_resources: pb(
    "qmb_income_resources",
    "QMB income or resource limit",
    ["QMB"],
    "QMB pays Medicare premiums and cost-sharing under separate financial rules. Loss of SSDI cash does not automatically start or stop QMB. SSDI itself has no asset test.",
    "Report QMB/Extra Help changes to DHS/SSA as required. Screen SLMB, QI, Extra Help, and later reapplication after resources fall. Update the DHS address separately from SSA.",
    {
      personaId: "george_gift_qmb_lis",
      documents: [
        "Medicare card and premium notices",
        "Income and resource proof",
        "Gift/settlement records if a lump sum arrived",
        "Proof of address updates with DHS and SSA",
      ],
    },
  ),

  extra_help_income: pb(
    "extra_help_income",
    "Medicare Extra Help (LIS) income or resources",
    ["ExtraHelp"],
    "2026 Extra Help single limits are about $2,015/mo income and $18,090 resources. SSDI, DAC, and wages count; SSDI has no asset test of its own.",
    "Report changes to SSA by the 10th of the next month. A large gift can threaten Extra Help without touching SSDI.",
    { personaId: "george_gift_qmb_lis" },
  ),

  snap_gross_200_fpl: pb(
    "snap_gross_200_fpl",
    "SNAP gross income may exceed 200% FPL",
    ["SNAP"],
    "PA SNAP uses a 200% FPL gross test (about $2,610 for HH1). Crossing it is typically a 10-day reportable change.",
    "Report to COMPASS/CAO. Recalculate with earned-income deduction, shelter, and allowable medical expenses. If overtime was temporary, say so and send later regular pay stubs so the agency does not project the spike forever.",
    {
      personaId: "nicole_overtime_churn",
      closureCodes: ["440", "474"],
    },
  ),

  snap_work_exemption_lost: pb(
    "snap_work_exemption_lost",
    "A SNAP work exemption may no longer apply",
    ["SNAP"],
    "Losing disability status, dropping required hours, a child turning 14, aging into a new work-rule band, or a repealed exemption (veteran / former foster youth, as described in the 2025–26 policy deck) can expose the household to time limits.",
    "Verify the current Pennsylvania rule and effective date. Screen every remaining exemption and good cause before treating the person as noncompliant. If no exemption applies, document qualifying activity each required period.",
    {
      personaId: "walter_snap_age_limit",
      effectiveDateNote: VERIFY_FUTURE_POLICY,
      closureCodes: ["440", "474"],
    },
  ),

  reporting_wage_change_10day: pb(
    "reporting_wage_change_10day",
    "Wage change — 10-day reporting clock",
    ["SSI", "SSDI", "DAC", "MedicaidABD", "MedicaidWaiver", "MAWD", "SNAP", "QMB"],
    "Most PA/SSA income and work changes must be reported by the 10th of the month after the change month.",
    "File with SSA and/or COMPASS/CAO. Keep gross pay stubs. Project SSI, SSDI work incentives, SNAP, and each Medicaid category separately before changing hours.",
    { personaId: "maria_earnings_double" },
  ),

  reporting_lump_sum: pb(
    "reporting_lump_sum",
    "Lump sum, inheritance, or settlement",
    ["SSI", "MedicaidABD"],
    "A lump sum can be income in the receipt month and a countable resource the next month. Spending later may fix resources but not the income event.",
    "Get benefits counsel before funds land. Do not give the money away or put it in another person's account. Same-month exempt purchases, a valid SNT, or ABLE may be options — complete them correctly and report accurately.",
    {
      personaId: "raymond_settlement",
      documents: [
        "Settlement, will, or gift documents",
        "Deposit record and later statements",
        "Trust, ABLE, or lien paperwork",
        "Receipts for same-month permitted spending",
      ],
    },
  ),

  reporting_household_change: pb(
    "reporting_household_change",
    "Household composition change",
    ["SNAP", "MedicaidABD", "MedicaidMAGI", "MedicaidWaiver", "SSI"],
    "Someone moving in or out, a child turning 22, or a spouse joining can change SNAP/Medicaid household size and SSI deeming. A prenuptial agreement generally does not stop federal deeming.",
    "Report the marriage or living arrangement to SSA and DHS with proof of the other person's income and resources. Recalculate SNAP as a mandatory spouse household.",
    { personaId: "denise_marriage_deeming" },
  ),

  ssdi_snt_shelter_ok: pb(
    "ssdi_snt_shelter_ok",
    "SNT shelter while on SSDI (not SSI)",
    ["SSDI"],
    "SSDI has no ISM reduction — vendor-paid shelter from a third-party SNT generally does not count as personal income if the trust stays titled owner.",
    "Still report wages. Do not assume the same rule if the person also receives SSI.",
    { personaId: "david_snt_rent_cash" },
  ),

  overpayment_unreported_change: pb(
    "overpayment_unreported_change",
    "Overpayment risk from late reporting",
    ["SSI", "SSDI", "MedicaidABD", "MedicaidMAGI", "MedicaidWaiver", "MAWD", "SNAP"],
    "Late or missing reports commonly create overpayment demands even when the person remains eligible after recalculation.",
    "When in doubt, report early. Keep dated proof of what was filed. Appeal incorrect overpayments and request waiver when the facts support it.",
  ),

  ssi_1619b_medicaid_while_zero: pb(
    "ssi_1619b_medicaid_while_zero",
    "1619(b) — Medicaid while SSI cash is $0",
    ["SSI", "MedicaidABD"],
    "When earned income zeros the SSI check, 1619(b) can keep Medicaid if other 1619(b) tests are met. Losing SSI cash is not automatically losing medical coverage.",
    "Ask SSA/CAO whether 1619(b) applies, and still screen MAWD or a waiver before a gap.",
    { personaId: "maria_earnings_double" },
  ),

  medicaid_renewal_packet: pb(
    "medicaid_renewal_packet",
    "Medicaid renewal packet due",
    ["MedicaidABD", "MedicaidMAGI", "MedicaidWaiver", "MAWD", "QMB"],
    "Coverage can close for failure to complete renewal or verification even when the person still meets the financial rules. A DHS closure code is a recorded case action, not proof of who caused a failure.",
    "Open COMPASS and every mailed notice. Submit the signed renewal and every requested document before the due date. Call the CAO to confirm what is still missing. If closed, ask about reconsideration and appeal; file a new application in parallel.",
    {
      personaId: "elena_medicaid_renewal",
      closureCodes: ["042", "474"],
      documents: [
        "Renewal form and COMPASS confirmation",
        "Requested bank statements (full pages, not screenshots)",
        "Income proof",
        "CAO call log (worker, date, instructions)",
      ],
    },
  ),
};

export type AlertPlaybookSource = {
  playbookId?: unknown;
  scenarioId?: unknown;
  program?: unknown;
  thresholdType?: unknown;
  trigger?: unknown;
  title?: unknown;
};

export function playbookIdForThreshold(program: string, thresholdType: string): string {
  const p = String(program ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const asset = thresholdType === "asset_balance";
  if (p === "SSI") return asset ? "ssi_resources_2k" : "ssi_countable_income_fbr";
  if (p === "SSDI") return "ssdi_sga_after_twp";
  if (p === "DAC") return "dac_sga_disability";
  if (p.includes("WAIVER") || p === "CHC") return "waiver_income_2982";
  if (p === "MAWD") return "mawd_transition";
  if (p === "QMB") return "qmb_income_resources";
  if (p.includes("EXTRA") || p === "LIS") return "extra_help_income";
  if (p === "SNAP") return "snap_gross_200_fpl";
  if (p.includes("MAGI")) return "lucas_magi_income";
  if (p.includes("ABD") || p === "MEDICAID") return asset ? "abd_resources_2k" : "abd_income_limit";
  if (p === "ABLE") return "ssi_able_100k";
  return "generic_limit";
}

export function playbookById(id: string | undefined | null): AlertPlaybook | undefined {
  if (!id) return undefined;
  return ALERT_PLAYBOOKS[id];
}

export function resolveAlertPlaybook(source: AlertPlaybookSource): AlertPlaybook {
  const fromIds = [source.playbookId, source.scenarioId]
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
  for (const id of fromIds) {
    const hit = ALERT_PLAYBOOKS[id];
    if (hit) return hit;
  }
  const program = typeof source.program === "string" ? source.program : "";
  const thresholdType = typeof source.thresholdType === "string" ? source.thresholdType : "";
  if (program) {
    return ALERT_PLAYBOOKS[playbookIdForThreshold(program, thresholdType)] ?? ALERT_PLAYBOOKS.generic_limit!;
  }
  return ALERT_PLAYBOOKS.generic_limit!;
}

export function playbookPersonaSteps(playbook: AlertPlaybook): string[] {
  if (!playbook.personaId) return [];
  return personaById(playbook.personaId)?.steps ?? [];
}

export function closureCodeNotes(playbook: AlertPlaybook): { code: ClosureCode; note: string }[] {
  return (playbook.closureCodes ?? []).map((code) => ({ code, note: CLOSURE_CODE_NOTES[code] }));
}

export function playbookEmailParagraphs(playbook: AlertPlaybook): string[] {
  const programs = playbook.programs.length ? playbook.programs.join(", ") : "See enrolled programs";
  const docs = playbook.documents.join("; ");
  const paras = [
    `${playbook.title}`,
    `Threatened program: ${programs}`,
    `Triggering rule: ${playbook.triggeringRule}`,
    `Deadline: ${playbook.effectiveDateNote}`,
    `What to do: ${playbook.cureAction}`,
    `Documents: ${docs}`,
    `If this category cannot continue: ${playbook.alternativePathway}`,
    `Appeal / continued benefits: ${playbook.appealNote}`,
    INFORMATIONAL_ONLY,
  ];
  const codes = closureCodeNotes(playbook);
  if (codes.length) {
    paras.splice(
      8,
      0,
      `Closure-code note: ${codes.map((c) => `${c.code} — ${c.note}`).join(" ")}`,
    );
  }
  return paras;
}

export function playbookPushBody(playbook: AlertPlaybook): string {
  return `${playbook.cureAction} ${INFORMATIONAL_ONLY}`.slice(0, 180);
}

/** Every catalog scenario must have a playbook with the same id. */
export function scenarioPlaybookCoverage(): { missing: string[] } {
  const missing = ELIGIBILITY_LOSS_SCENARIOS.map((s) => s.id).filter((id) => !ALERT_PLAYBOOKS[id]);
  return { missing };
}
