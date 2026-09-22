import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity/log-activity";
import {
  ELIGIBILITY_LOSS_SCENARIOS,
  type EligibilityLossScenario,
} from "@/lib/alerts/eligibility-loss-scenarios";
import Alert from "@/lib/db/models/Alert";
import {
  ageMilestoneWindow,
  lumpSumNeedsReport,
  ssiFbrCents,
  ssiResourceLimitCents,
} from "@/lib/benefits/ssi";
import { abdIncomeLimitCents, abdResourceLimitCents } from "@/lib/benefits/abd-limits";
import {
  mawdIncomeAlert,
  mawdIncomeLimitCents,
  mawdJobSuccessIncomeLimitCents,
  mawdResourceAlert,
} from "@/lib/benefits/mawd-limits";
import { WAIVER_GROSS_INCOME_CENTS, waiverIncomeAlert, waiverResourceAlert } from "@/lib/benefits/waiver-limits";
import { dacSgaAlert, dacWaiverTwilight, ssdiWageAlert, ssdiWaiverTwilight } from "@/lib/benefits/work-planner";
import {
  SNAP_ELDERLY_RESOURCE_CENTS,
  snapGross130Cents,
  snapGross200Cents,
} from "@/lib/benefits/snap-limits";
import { ageFromDateOfBirth } from "@/lib/policy/screen";
import { detectWageChange, programsThatMustReportWageChange, type WageDeposit } from "@/lib/alerts/wage-change";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import { enrolledMatchesProgram } from "@/lib/programs";

/** 2026 non-blind SGA and TWP service-month triggers (cents). */
const SGA_NONBLIND_CENTS = 1690_00;
const QMB_INCOME_CENTS = 1350_00;
const EXTRA_HELP_INCOME_CENTS = 2015_00;

export type ScenarioEvalInput = {
  beneficiaryId: Types.ObjectId;
  ownerUserId: Types.ObjectId | string;
  actorUserId: string;
  programs: string[];
  earnedGrossCents: number;
  priorEarnedGrossCents?: number;
  ssiCountableCents: number;
  maxAssetCents: number;
  grossMonthlyCents: number;
  otherInflowCents?: number;
  monthPrefix: string;
  earnedDeposits?: WageDeposit[];
  /** Any transaction, wage or not, exists before monthPrefix. */
  hasHistoryBeforeMonth?: boolean;
  householdSize?: number;
  now?: Date;
  /** SSI countable income after removing the SSI payment and applying the student exclusion. */
  ssiAdjustedCountableCents?: number;
  /** Same rules with earned income set to zero, used to tell wages from unearned income. */
  ssiUnearnedOnlyCents?: number;
  ableBalanceCents?: number;
  sntCashDeposit?: boolean;
  dateOfBirth?: Date | string | null;
  /** Trial Work Period service months the household has recorded. Zero means none recorded yet. */
  twpMonthsUsed?: number;
  /** SNAP gross income with one-time lump sums removed. */
  snapGrossCents?: number;
  substantialGamblingWin?: boolean;
  /** Healthy Horizons countable income, with the SSI payment and a DAC benefit removed. */
  abdCountableCents?: number;
  /** Waiver gross countable income. A DAC benefit is already removed. */
  waiverGrossCents?: number;
  /** Marital status recorded as married. The community-spouse resource share is not inferred from this. */
  married?: boolean;
  /** MAWD countable income, after the $20, $65, and one-half exclusions. */
  mawdCountableCents?: number;
  /** True when Workers with Job Success is recorded on the MAWD enrollment. */
  mawdJobSuccess?: boolean;
};

function hasProgram(programs: string[], code: string): boolean {
  return programs.some((p) => p.toUpperCase() === code.toUpperCase());
}

function enrolledFor(scenario: EligibilityLossScenario, programSet: string[]): boolean {
  return scenario.programs.some((p) => enrolledMatchesProgram(programSet, p));
}

function alertMessage(s: EligibilityLossScenario): string {
  return `${s.title}: ${s.risk}`;
}

async function recentlyAlerted(beneficiaryId: Types.ObjectId, scenarioId: string): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86400000);
  const recent = await Alert.findOne({
    beneficiaryId,
    "dataSnapshot.scenarioId": scenarioId,
    status: { $in: ["new", "acknowledged"] },
    createdAt: { $gte: since },
  })
    .select({ _id: 1 })
    .lean();
  return Boolean(recent);
}

/**
 * Emits scenario-specific warning alerts (cliff / reporting / snt / able)
 * beyond the generic threshold predictive/trend/breach messages.
 */
export async function evaluateScenarioAlerts(
  input: ScenarioEvalInput,
): Promise<{ alertsCreated: number; alertIdsCreated: Types.ObjectId[] }> {
  const programSet = input.programs.map((p) => p.toUpperCase());
  const candidates: { scenario: EligibilityLossScenario; level: "info" | "warning" | "breach" }[] = [];

  const consider = (id: string, level?: "info" | "warning" | "breach") => {
    const s = ELIGIBILITY_LOSS_SCENARIOS.find((x) => x.id === id);
    if (!s?.autoDetect) return;
    if (!enrolledFor(s, programSet)) return;
    if (candidates.some((c) => c.scenario.id === id)) return;
    const resolved =
      level ?? (s.level === "info" ? "info" : s.level === "breach" ? "breach" : "warning");
    candidates.push({ scenario: s, level: resolved });
  };

  const earned = input.earnedGrossCents;
  const countable = input.ssiCountableCents;
  const assets = input.maxAssetCents;
  const gross = input.grossMonthlyCents;
  const householdSize = input.householdSize ?? 1;
  const now = input.now ?? new Date();

  if (hasProgram(input.programs, "SSDI")) {
    const ssdiAlert = ssdiWageAlert(earned, input.twpMonthsUsed ?? 0);
    if (ssdiAlert === "sga") consider("ssdi_sga_after_twp", "breach");
    else if (ssdiAlert === "twp") consider("ssdi_twp_service_month", "warning");
  }
  if (hasProgram(input.programs, "DAC")) {
    const dacAlert = dacSgaAlert(earned);
    if (dacAlert) consider("dac_sga_disability", dacAlert);
  }
  if (hasProgram(input.programs, "SSI")) {
    const fbr = ssiFbrCents(householdSize);
    const ssiCount = input.ssiAdjustedCountableCents ?? countable;
    if (ssiCount >= fbr) consider("ssi_countable_income_fbr", "breach");
    else if (ssiCount >= Math.floor(fbr * 0.85)) consider("ssi_countable_income_fbr", "warning");

    const resourceLimit = ssiResourceLimitCents(householdSize);
    if (assets > resourceLimit) consider("ssi_resources_2k", "breach");
    else if (assets > Math.floor(resourceLimit * 0.85)) consider("ssi_resources_2k", "warning");

    const unearnedOnly = input.ssiUnearnedOnlyCents;
    if (earned > 0 && unearnedOnly != null && ssiCount >= fbr && unearnedOnly < fbr) {
      consider("ssi_1619b_medicaid_while_zero");
    }

    const dob = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    if (ageMilestoneWindow(dob, 18, now, 120, 30)) consider("ssi_age18_redetermination");
    if (ageMilestoneWindow(dob, 22, now, 90, 30)) consider("ssi_student_exclusion_ends");
    if (input.sntCashDeposit) consider("ssi_snt_cash");
  }
  const able = input.ableBalanceCents ?? 0;
  if (able > 100_000_00) consider("ssi_able_100k", "breach");
  else if (able > Math.floor(100_000_00 * 0.85)) consider("ssi_able_100k", "warning");
  if (hasProgram(input.programs, "MedicaidABD")) {
    const abdIncome = input.abdCountableCents ?? countable;
    const abdLimit = abdIncomeLimitCents(householdSize);
    if (abdIncome >= abdLimit) consider("abd_income_limit", "breach");
    else if (abdIncome >= Math.floor(abdLimit * 0.85)) consider("abd_income_limit", "warning");

    const age = ageFromDateOfBirth(input.dateOfBirth, now);
    // A waiver enrollment uses the waiver resource alert, which also knows the SSI and marriage exceptions.
    if (!hasProgram(input.programs, "MedicaidWaiver")) {
      const resourceLimit = abdResourceLimitCents({
        householdSize,
        onWaiver: false,
        age,
      });
      if (resourceLimit != null) {
        if (assets > resourceLimit) consider("abd_resources_2k", "breach");
        else if (assets > Math.floor(resourceLimit * 0.85)) consider("abd_resources_2k", "warning");
      }
    }
    if (earned > 0 && abdIncome >= abdLimit && !hasProgram(input.programs, "MAWD")) consider("mawd_transition");
  }
  if (hasProgram(input.programs, "MedicaidWaiver") && !hasProgram(input.programs, "SSI")) {
    const waiverGross = input.waiverGrossCents ?? gross;
    const incomeLevel = waiverIncomeAlert(waiverGross);
    if (incomeLevel) consider("waiver_income_2982", incomeLevel);
    if (!input.married) {
      const resourceLevel = waiverResourceAlert(assets);
      if (resourceLevel) consider("waiver_resources_8k", resourceLevel);
    }
    if (earned > 0 && waiverGross > WAIVER_GROSS_INCOME_CENTS && !hasProgram(input.programs, "MAWD")) {
      consider("mawd_transition");
    }
    if (
      (hasProgram(input.programs, "SSDI") &&
        ssdiWaiverTwilight(earned, waiverGross, input.twpMonthsUsed ?? 0)) ||
      (hasProgram(input.programs, "DAC") && dacWaiverTwilight(earned, waiverGross))
    ) {
      consider("ssdi_waiver_twilight");
    }
  }
  if (hasProgram(input.programs, "MAWD")) {
    const mawdIncome = input.mawdCountableCents ?? countable;
    const mawdLimit = input.mawdJobSuccess
      ? mawdJobSuccessIncomeLimitCents(householdSize)
      : mawdIncomeLimitCents(householdSize);
    const incomeLevel = mawdIncomeAlert(mawdIncome, mawdLimit);
    if (incomeLevel) consider("mawd_income_limit", incomeLevel);
    if (!input.mawdJobSuccess) {
      const resourceLevel = mawdResourceAlert(assets);
      if (resourceLevel) consider("mawd_resources_10k", resourceLevel);
    }
  }
  if (
    !hasProgram(input.programs, "MedicaidABD") &&
    !hasProgram(input.programs, "MedicaidWaiver") &&
    !hasProgram(input.programs, "MAWD") &&
    hasProgram(input.programs, "Medicaid") &&
    earned >= SGA_NONBLIND_CENTS
  ) {
    consider("mawd_transition");
  }
  if (
    hasProgram(input.programs, "QMB") &&
    (countable >= Math.floor(QMB_INCOME_CENTS * 0.85) || gross >= Math.floor(QMB_INCOME_CENTS * 0.85))
  ) {
    consider("qmb_income_resources");
  }
  if (
    programSet.some((x) => x.includes("EXTRA") || x === "LIS" || x === "EXTRAHELP") &&
    gross >= Math.floor(EXTRA_HELP_INCOME_CENTS * 0.85)
  ) {
    consider("extra_help_income");
  }
  if (hasProgram(input.programs, "SNAP")) {
    const snapGross = input.snapGrossCents ?? gross;
    if (snapGross > snapGross130Cents(householdSize)) consider("snap_report_130_fpl", "warning");
    if (input.substantialGamblingWin) consider("snap_gambling_winnings", "breach");
    const age = ageFromDateOfBirth(input.dateOfBirth, now);
    const elderlyOrDisabled =
      (age != null && age >= 60) ||
      hasProgram(input.programs, "SSI") ||
      hasProgram(input.programs, "SSDI") ||
      hasProgram(input.programs, "DAC");
    if (elderlyOrDisabled && snapGross > snapGross200Cents(householdSize)) {
      if (assets > SNAP_ELDERLY_RESOURCE_CENTS) consider("snap_elderly_resources", "breach");
      else if (assets > Math.floor(SNAP_ELDERLY_RESOURCE_CENTS * 0.85)) {
        consider("snap_elderly_resources", "warning");
      }
    }
  }

  const wageKind = detectWageChange({
    monthPrefix: input.monthPrefix,
    deposits: input.earnedDeposits ?? [],
    now,
    hasHistoryBeforeMonth: input.hasHistoryBeforeMonth,
  });
  if (
    wageKind &&
    programsThatMustReportWageChange(input.programs, wageKind, input.snapGrossCents ?? gross, householdSize).length > 0
  ) {
    consider("reporting_wage_change_10day");
  }
  const otherIn = input.otherInflowCents ?? 0;
  if (
    lumpSumNeedsReport({
      otherInflowCents: otherIn,
      assetCents: assets,
      programs: input.programs,
      householdSize,
      age: ageFromDateOfBirth(input.dateOfBirth, now),
    })
  ) {
    consider("reporting_lump_sum");
  }
  const overdue = await ReportingDeadline.exists({
    beneficiaryId: input.beneficiaryId,
    completedAt: null,
    kind: "deadline",
    dueDate: { $lt: now },
  });
  if (overdue) consider("overpayment_unreported_change");

  const alertIdsCreated: Types.ObjectId[] = [];
  let alertsCreated = 0;

  for (const pending of candidates) {
    if (await recentlyAlerted(input.beneficiaryId, pending.scenario.id)) continue;
    const createdId = await insertScenarioAlert({
      beneficiaryId: input.beneficiaryId,
      ownerUserId: input.ownerUserId,
      actorUserId: input.actorUserId,
      scenario: pending.scenario,
      level: pending.level,
      monthPrefix: input.monthPrefix,
      earnedGrossCents: earned,
      ssiCountableCents: input.ssiAdjustedCountableCents ?? countable,
      maxAssetCents: assets,
      grossMonthlyCents: gross,
    });
    alertsCreated += 1;
    alertIdsCreated.push(createdId);
  }

  return { alertsCreated, alertIdsCreated };
}

export function isMarriedStatus(value: string | null | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "married";
}

/** Fired when a DAC enrollee's marital status is set to married. Not inferred from bank deposits. */
export async function emitDacMarriageAlert(input: {
  beneficiaryId: Types.ObjectId;
  ownerUserId: Types.ObjectId | string;
  actorUserId: string;
  programs: string[];
}): Promise<Types.ObjectId | null> {
  if (!input.programs.some((p) => p.toUpperCase() === "DAC")) return null;
  const scenario = ELIGIBILITY_LOSS_SCENARIOS.find((s) => s.id === "dac_marriage");
  if (!scenario) return null;
  if (await recentlyAlerted(input.beneficiaryId, scenario.id)) return null;
  return insertScenarioAlert({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: input.ownerUserId,
    actorUserId: input.actorUserId,
    scenario,
    monthPrefix: new Date().toISOString().slice(0, 7),
  });
}

/** Fired when household size or marital status actually changes. Not inferred from bank deposits. */
export async function emitHouseholdChangeAlert(input: {
  beneficiaryId: Types.ObjectId;
  ownerUserId: Types.ObjectId | string;
  actorUserId: string;
  programs: string[];
}): Promise<Types.ObjectId | null> {
  const scenario = ELIGIBILITY_LOSS_SCENARIOS.find((s) => s.id === "reporting_household_change");
  if (!scenario || !enrolledFor(scenario, input.programs)) return null;
  if (await recentlyAlerted(input.beneficiaryId, scenario.id)) return null;
  return insertScenarioAlert({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: input.ownerUserId,
    actorUserId: input.actorUserId,
    scenario,
    monthPrefix: new Date().toISOString().slice(0, 7),
  });
}

async function insertScenarioAlert(input: {
  beneficiaryId: Types.ObjectId;
  ownerUserId: Types.ObjectId | string;
  actorUserId: string;
  scenario: EligibilityLossScenario;
  level?: "info" | "warning" | "breach";
  monthPrefix: string;
  earnedGrossCents?: number;
  ssiCountableCents?: number;
  maxAssetCents?: number;
  grossMonthlyCents?: number;
}): Promise<Types.ObjectId> {
  const s = input.scenario;
  const level = input.level ?? (s.level === "info" ? "info" : s.level === "breach" ? "breach" : "warning");
  const created = await Alert.create({
    beneficiaryId: input.beneficiaryId,
    userId: input.ownerUserId,
    thresholdId: null,
    level,
    trigger: s.trigger,
    message: alertMessage(s),
    dataSnapshot: {
      scenarioId: s.id,
      playbookId: s.id,
      title: s.title,
      programs: s.programs,
      monthPrefix: input.monthPrefix,
      earnedGrossCents: input.earnedGrossCents ?? 0,
      ssiCountableCents: input.ssiCountableCents ?? 0,
      maxAssetCents: input.maxAssetCents ?? 0,
      grossMonthlyCents: input.grossMonthlyCents ?? 0,
    },
    status: "new",
  });
  await logActivity({
    userId: input.actorUserId,
    beneficiaryId: input.beneficiaryId,
    category: "alert",
    action: "alert.created",
    resourceType: "alert",
    resourceId: created._id.toString(),
    details: { scenarioId: s.id, level, trigger: s.trigger },
  });
  return created._id as Types.ObjectId;
}
