/**
 * Five salary-increase × SNT-disbursement scenarios with reporting steps.
 * Encodes Frank’s Jul 22 “Are we good here?” follow-up: wage changes and trust
 * payout method must be reasoned together, not separately.
 */

import {
  presumedMaxValueCents,
  SSI_FBR_INDIVIDUAL_CENTS,
  SSI_FBR_YEAR,
} from "@/lib/benefits/ssi";
import { formatPlainUsdFromCents } from "@/lib/format/money";

export type SalarySntScenario = {
  id: string;
  title: string;
  setup: string;
  ssiImpact: string;
  ssdiImpact: string;
  reportingSteps: string[];
  vaultTips: string[];
};

const pmv = formatPlainUsdFromCents(presumedMaxValueCents(SSI_FBR_INDIVIDUAL_CENTS));
const sga = "$1,690";
const twp = "$1,210";

export const SALARY_SNT_SCENARIOS: SalarySntScenario[] = [
  {
    id: "salary_only",
    title: "1. Salary increase only (no SNT payout this month)",
    setup: "Gross wages go up. No Special Needs Trust distribution in the same month.",
    ssiImpact:
      "Countable earned income = (gross − $85) ÷ 2. Higher wages lower the SSI check on the sliding scale; they do not create ISM.",
    ssdiImpact: `Watch SGA (${sga}/mo non-blind, ${SSI_FBR_YEAR}) and TWP service months (${twp}/mo). After 9 TWP months, SGA can zero the SSDI check.`,
    reportingSteps: [
      "Report the wage change to SSA (SSI and/or SSDI/DAC) by the 10th of the month after the change month.",
      "Report to COMPASS / County Assistance Office for Medicaid, Waiver, SNAP, and QMB if enrolled.",
      "File gross pay stubs (not just deposit dates) — bank deposits alone understate overtime and miss pre-tax deductions timing.",
    ],
    vaultTips: ["Job & income — pay stubs", "Work & activity — hours if MAGI work rules may apply"],
  },
  {
    id: "salary_plus_snt_cash",
    title: "2. Salary increase + SNT cash to the beneficiary",
    setup: "Wages rise and the trust also writes a check or transfers cash to the beneficiary.",
    ssiImpact:
      "Cash is unearned income dollar-for-dollar after the $20 general exclusion — often worse than the wage increase alone. An SNT should avoid cash distributions.",
    ssdiImpact:
      "SSDI does not use ISM, but cash can still matter for Medicaid resource/income tests. Wage SGA rules still apply.",
    reportingSteps: [
      "Report the wage change to SSA and CAO/COMPASS (same 10-day / 10th-of-next-month rule).",
      "Separately report the cash as unearned income to SSA (SSI) in the month received.",
      "Ask the trustee to stop cash payouts; switch future support to vendor payments.",
    ],
    vaultTips: ["Job & income — pay stubs", "ABLE & SNT statements — ledger showing the cash distribution"],
  },
  {
    id: "salary_plus_snt_shelter",
    title: "3. Salary increase + SNT shelter paid to a vendor",
    setup: "Wages rise; the trust pays rent, mortgage, property tax, or utilities directly to the landlord/utility.",
    ssiImpact: `Shelter paid to a vendor is ISM, counted at no more than the Presumed Maximum Value (${pmv} in ${SSI_FBR_YEAR}). Net SSI reduction is capped (~⅓ FBR), not dollar-for-dollar on a large rent check.`,
    ssdiImpact:
      "If the person is on SSDI (not SSI), vendor-paid shelter from a third-party SNT generally does not reduce the SSDI check. Still report wages.",
    reportingSteps: [
      "Report the wage change to SSA / COMPASS as in scenario 1.",
      "For SSI: expect the capped ISM reduction; keep the vendor invoice and trust ledger.",
      "Confirm living arrangement (VTR vs PMV) with SSA or a counselor if the person shares housing.",
    ],
    vaultTips: [
      "Expenses — rent/utility invoices",
      "ABLE & SNT statements — disbursement ledger coded as shelter",
    ],
  },
  {
    id: "salary_plus_snt_food",
    title: "4. Salary increase + SNT food / excluded vendor payment",
    setup: "Wages rise; the trust pays groceries, internet, phone, cable, tuition, or similar directly to vendors.",
    ssiImpact:
      "Food and these non-shelter vendor payments are excluded from countable income (SSA rule effective Sept 30, 2024 — 89 FR 21246). They do not reduce SSI. Only the wage increase affects the check.",
    ssdiImpact: "No ISM issue for SSDI. Report wages only for the trust side.",
    reportingSteps: [
      "Report the wage change to SSA and CAO/COMPASS.",
      "No SSI unearned-income report is required for properly structured excluded vendor payments — keep invoices anyway.",
      "Do not mix cash reimbursements to the beneficiary; that reintroduces countable income.",
    ],
    vaultTips: ["Job & income — pay stubs", "Expenses — grocery/vendor invoices paid by the trust"],
  },
  {
    id: "salary_past_sga_snt_shelter",
    title: "5. Salary jumps past SGA + ongoing SNT shelter",
    setup: `Gross wages cross SGA (${sga}/mo) while the trust continues paying housing to vendors.`,
    ssiImpact:
      "If still on SSI: wages use the earned-income formula; shelter ISM still applies up to the PMV cap. Cash benefit may already be $0 from wages alone.",
    ssdiImpact: `After TWP/EPE rules, SGA-level earnings can drop SSDI cash to $0 (the “twilight zone”). Waiver income limit (~$2,982) may still be safe — ask about MAWD to keep Medicaid/Waiver.`,
    reportingSteps: [
      "Immediately report work and pay rate to SSA (SSDI/DAC and SSI as applicable).",
      "Ask CAO about MAWD (paid work required; premium ≈ 5% of countable income) before Medicaid gaps.",
      "Keep SNT shelter on vendor payment — do not switch to cash while wages are high.",
      "Upload pay stubs, SNT ledger, and any MAWD/Waiver notices to the Vault the same week.",
    ],
    vaultTips: [
      "Job & income — pay stubs showing gross ≥ SGA",
      "ABLE & SNT statements — ongoing shelter ledger",
      "Agency correspondence — SSA and CAO filings",
    ],
  },
];
