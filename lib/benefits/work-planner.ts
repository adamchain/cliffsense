import {
  SSI_FBR_INDIVIDUAL_CENTS,
} from "@/lib/benefits/ssi";
import {
  SSI_EARNED_INCOME_EXCLUSION_CENTS,
  SSI_GENERAL_INCOME_EXCLUSION_CENTS,
  ssiCountableMonthlyIncomeCents,
} from "@/lib/thresholds/metrics";

export const SGA_NONBLIND_CENTS = 1690_00;
export const TWP_SERVICE_CENTS = 1210_00;
export const MAWD_INCOME_CENTS = 3325_00;
export const SNAP_HH1_GROSS_CENTS = 2610_00;
export const ABD_INCOME_CENTS = 1330_00;
export const WAIVER_INCOME_CENTS = 2982_00;

export type WorkPlannerInput = {
  monthlyGrossWagesCents: number;
  otherUnearnedCents: number;
  twpMonthsUsed: number;
  overtimeIsTemporary: boolean;
};

export type WorkPlannerRow = {
  id: string;
  program: string;
  status: "ok" | "watch" | "concern";
  headline: string;
  detail: string;
};

export function ssiCountableFromWages(wagesCents: number, unearnedCents: number): number {
  return ssiCountableMonthlyIncomeCents({
    earnedNetCents: wagesCents,
    earnedGrossCents: wagesCents,
    benefitCents: unearnedCents,
    otherCents: 0,
  });
}

export function evaluateWorkPlanner(input: WorkPlannerInput): WorkPlannerRow[] {
  const wages = Math.max(0, Math.round(input.monthlyGrossWagesCents));
  const unearned = Math.max(0, Math.round(input.otherUnearnedCents));
  const twp = Math.min(9, Math.max(0, Math.round(input.twpMonthsUsed)));
  const countable = ssiCountableFromWages(wages, unearned);
  const ssiLeft = Math.max(0, SSI_FBR_INDIVIDUAL_CENTS - countable);
  const twpMonth = wages >= TWP_SERVICE_CENTS;
  const sga = wages >= SGA_NONBLIND_CENTS;
  const afterTwp = twp >= 9;

  const rows: WorkPlannerRow[] = [
    {
      id: "ssi",
      program: "SSI",
      status: ssiLeft <= 0 ? "concern" : countable >= Math.floor(SSI_FBR_INDIVIDUAL_CENTS * 0.85) ? "watch" : "ok",
      headline:
        ssiLeft <= 0
          ? "SSI cash estimates at $0 this month"
          : `SSI cash estimate about $${(ssiLeft / 100).toFixed(0)}`,
      detail: `Countable income ≈ $${(countable / 100).toFixed(0)} after the $${SSI_GENERAL_INCOME_EXCLUSION_CENTS / 100} / $${SSI_EARNED_INCOME_EXCLUSION_CENTS / 100} / ½ rules (FBR $${SSI_FBR_INDIVIDUAL_CENTS / 100}). Screen 1619(b) or MAWD before assuming Medicaid ends with the check.`,
    },
    {
      id: "ssdi",
      program: "SSDI",
      status: afterTwp && sga ? "concern" : twpMonth ? "watch" : "ok",
      headline: afterTwp && sga
        ? "Past TWP and at or above SGA — SSDI cash is at risk"
        : twpMonth
          ? `This month may count as TWP month ${Math.min(9, twp + 1)} of 9`
          : "Below the TWP service-month amount",
      detail: afterTwp && sga
        ? `Gross wages at or above SGA ($${(SGA_NONBLIND_CENTS / 100).toFixed(0)}). Count IRWEs/subsidy before treating bank deposits as countable earnings. Medicare may continue; QMB is separate.`
        : `TWP service month is $${(TWP_SERVICE_CENTS / 100).toFixed(0)} gross. SGA is $${(SGA_NONBLIND_CENTS / 100).toFixed(0)}. You have logged ${twp} TWP months used.`,
    },
    {
      id: "snap",
      program: "SNAP",
      status: wages + unearned >= SNAP_HH1_GROSS_CENTS ? "concern" : "ok",
      headline:
        wages + unearned >= SNAP_HH1_GROSS_CENTS
          ? "Household-1 SNAP gross test may be exceeded"
          : "SNAP gross (HH1 200% FPL) still has room on this wage level",
      detail: input.overtimeIsTemporary
        ? "Mark overtime as temporary when you report so the agency does not project a short spike indefinitely. Recalculate with earned-income deduction and shelter."
        : `PA SNAP 200% FPL for HH1 is about $${(SNAP_HH1_GROSS_CENTS / 100).toFixed(0)}/mo. Household size and deductions change the real result.`,
    },
    {
      id: "mawd",
      program: "MAWD",
      status: wages <= 0 ? "concern" : wages > MAWD_INCOME_CENTS ? "watch" : "ok",
      headline:
        wages <= 0
          ? "MAWD requires paid work — $0 wages can end the category"
          : "Paid work is present for MAWD",
      detail: `MAWD countable income ceiling is about $${(MAWD_INCOME_CENTS / 100).toFixed(0)} (250% FPL) plus a premium. Volunteer work does not qualify. If wages will stop, apply for another Medicaid category before MAWD closes.`,
    },
    {
      id: "medicaid",
      program: "Medicaid",
      status: countable >= ABD_INCOME_CENTS ? "watch" : "ok",
      headline: "Compare ABD, waiver, MAGI, and MAWD separately",
      detail: `ABD ≈ $${(ABD_INCOME_CENTS / 100).toFixed(0)} (SSI counting). Waiver ≈ $${(WAIVER_INCOME_CENTS / 100).toFixed(0)}. MAGI uses current monthly MAGI, not assets. SSDI cash ending at SGA does not automatically end waiver income room.`,
    },
  ];
  return rows;
}
