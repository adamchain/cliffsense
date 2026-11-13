import type { Types } from "mongoose";
import { createContinuityAlert } from "@/lib/alerts/create-continuity-alert";
import {
  abdIncomeFinding,
  extraHelpIncomeFinding,
  isFinancialFinding,
  magiIncomeFinding,
  mawdIncomeFinding,
  qmbIncomeFinding,
  qmbResourceFinding,
  resourceScreenFinding,
  snapElderlyResourceFinding,
  snapReportingFinding,
  ssiIncomeFinding,
  waiverIncomeFinding,
  type FinancialFinding,
} from "@/lib/alerts/financial-finding";
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
  extraHelpIncomeAlert,
  extraHelpIncomeLimitCents,
  extraHelpIsAutomatic,
  extraHelpResourceAlert,
  extraHelpResourceLimitCents,
} from "@/lib/benefits/extra-help-limits";
import { magiAdultAgeApplies, magiAdultIncomeAlert, magiAdultIncomeLimitCents } from "@/lib/benefits/magi-limits";
import { qmbIncomeAlert, qmbResourceAlert, qmbIncomeLimitCents, qmbResourceLimitCents } from "@/lib/benefits/qmb-limits";
import {
  MAWD_RESOURCE_CENTS,
  mawdIncomeAlert,
  mawdIncomeLimitCents,
  mawdJobSuccessIncomeLimitCents,
  mawdResourceAlert,
} from "@/lib/benefits/mawd-limits";
import { WAIVER_GROSS_INCOME_CENTS, WAIVER_RESOURCE_CENTS, waiverIncomeAlert, waiverResourceAlert } from "@/lib/benefits/waiver-limits";
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
  /** QMB income before the $20 disregard. The published limit already includes that $20. */
  qmbIncomeCents?: number;
  /** Earned portion of the QMB figure, after the $65, IRWE, and one-half. */
  qmbEarnedCountableCents?: number;
  /** DAC dollars the waiver and Healthy Horizons calculators actually removed. */
  dacExcludedCents?: number;
  /** Extra Help income before the $20 disregard. The published limit already includes that $20. */
  extraHelpIncomeCents?: number;
  /** Monthly impairment-related work expenses. Applied to SGA, not to the Trial Work Period. */
  irweCents?: number;
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

const LEVEL_RANK: Record<string, number> = { info: 0, warning: 1, breach: 2 };

async function recentlyAlerted(
  beneficiaryId: Types.ObjectId,
  scenarioId: string,
  level: string,
  hasFinding: boolean,
): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86400000);
  const recent = await Alert.findOne({
    beneficiaryId,
    "dataSnapshot.scenarioId": scenarioId,
    status: { $in: ["new", "acknowledged"] },
    createdAt: { $gte: since },
  })
    .select({ _id: 1, level: 1, dataSnapshot: 1 })
    .lean();
  if (!recent) return false;
  // A higher severity is a material change and opens a new alert.
  if ((LEVEL_RANK[level] ?? 0) > (LEVEL_RANK[String(recent.level)] ?? 0)) return false;
  const snap = recent.dataSnapshot as { financialFinding?: unknown } | null;
  if (hasFinding && !isFinancialFinding(snap?.financialFinding)) return false;
  return true;
}

/**
 * Emits scenario-specific warning alerts (cliff / reporting / snt / able)
 * beyond the generic threshold predictive/trend/breach messages.
 */
export async function evaluateScenarioAlerts(
  input: ScenarioEvalInput,
): Promise<{ alertsCreated: number; alertIdsCreated: Types.ObjectId[] }> {
  const programSet = input.programs.map((p) => p.toUpperCase());
  const candidates: {
    scenario: EligibilityLossScenario;
    level: "info" | "warning" | "breach";
    finding?: FinancialFinding;
  }[] = [];

  const consider = (
    id: string,
    level?: "info" | "warning" | "breach",
    finding?: FinancialFinding,
  ) => {
    const s = ELIGIBILITY_LOSS_SCENARIOS.find((x) => x.id === id);
    if (!s?.autoDetect) return;
    if (!enrolledFor(s, programSet)) return;
    if (candidates.some((c) => c.scenario.id === id)) return;
    const resolved =
      level ?? (s.level === "info" ? "info" : s.level === "breach" ? "breach" : "warning");
    candidates.push({ scenario: s, level: resolved, finding });
  };

  const earned = input.earnedGrossCents;
  const sgaEarned = Math.max(0, earned - Math.max(0, input.irweCents ?? 0));
  const countable = input.ssiCountableCents;
  const assets = input.maxAssetCents;
  const gross = input.grossMonthlyCents;
  const householdSize = input.householdSize ?? 1;
  const now = input.now ?? new Date();

  if (hasProgram(input.programs, "SSDI")) {
    const twpUsed = input.twpMonthsUsed ?? 0;
    const grossAlert = ssdiWageAlert(earned, twpUsed);
    const sgaAlert = ssdiWageAlert(sgaEarned, twpUsed);
    if (sgaAlert === "sga") consider("ssdi_sga_after_twp", "breach");
    else if (grossAlert === "twp" || (grossAlert === "sga" && twpUsed < 9)) {
      consider("ssdi_twp_service_month", "warning");
    }
  }
  if (hasProgram(input.programs, "DAC")) {
    const dacAlert = dacSgaAlert(sgaEarned);
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
  if (hasProgram(input.programs, "SSI")) {
    if (able > 100_000_00) consider("ssi_able_100k", "breach");
    else if (able > Math.floor(100_000_00 * 0.85)) consider("ssi_able_100k", "warning");
  }
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
        ssdiWaiverTwilight(sgaEarned, waiverGross, input.twpMonthsUsed ?? 0)) ||
      (hasProgram(input.programs, "DAC") && dacWaiverTwilight(sgaEarned, waiverGross))
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
    sgaEarned >= SGA_NONBLIND_CENTS
  ) {
    consider("mawd_transition");
  }
  if (hasProgram(input.programs, "MedicaidMAGI") && !hasProgram(input.programs, "SSI")) {
    const age = ageFromDateOfBirth(input.dateOfBirth, now);
    if (magiAdultAgeApplies(age)) {
      const magiLimit = magiAdultIncomeLimitCents(householdSize);
      const magiLevel = magiAdultIncomeAlert(gross, magiLimit);
      if (magiLevel) consider("lucas_magi_income", magiLevel);
    }
  }
  if (hasProgram(input.programs, "QMB")) {
    const qmbIncome = input.qmbIncomeCents ?? countable;
    const incomeLimit = qmbIncomeLimitCents(householdSize);
    const incomeLevel = qmbIncomeAlert(qmbIncome, incomeLimit);
    if (incomeLevel) {
      const built = qmbIncomeFinding({
        programs: input.programs,
        countableCents: qmbIncome,
        earnedCountableCents: input.qmbEarnedCountableCents ?? 0,
        limitCents: incomeLimit,
        level: incomeLevel,
        irweCents: input.irweCents ?? 0,
        monthPrefix: input.monthPrefix,
        observedAt: now,
      });
      consider("qmb_income_resources", built.level, built.finding);
    }
    const resourceLimit = qmbResourceLimitCents(householdSize);
    const resourceLevel = qmbResourceAlert(assets, resourceLimit);
    if (resourceLevel) consider("qmb_resources", resourceLevel);
  }
  const onExtraHelp = input.programs.some((p) => {
    const key = p.toUpperCase();
    return key === "EXTRAHELP" || key === "LIS" || key.includes("EXTRA");
  });
  if (onExtraHelp && !extraHelpIsAutomatic(input.programs)) {
    const extraHelpIncome = input.extraHelpIncomeCents ?? countable;
    const incomeLimit = extraHelpIncomeLimitCents(householdSize);
    const incomeLevel = extraHelpIncomeAlert(extraHelpIncome, incomeLimit);
    if (incomeLevel) consider("extra_help_income", incomeLevel);
    const resourceLimit = extraHelpResourceLimitCents(householdSize);
    const resourceLevel = extraHelpResourceAlert(assets, resourceLimit);
    if (resourceLevel) consider("extra_help_resources", resourceLevel);
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
  const wageReportPrograms = wageKind
    ? programsThatMustReportWageChange(input.programs, wageKind, input.snapGrossCents ?? gross, householdSize)
    : [];
  if (wageReportPrograms.length > 0) {
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
    const financialFinding =
      pending.finding ??
      findingForScenario(pending.scenario.id, {
        programs: input.programs,
        assets,
        gross,
        snapGross: input.snapGrossCents ?? gross,
        householdSize,
        monthPrefix: input.monthPrefix,
        observedAt: now,
        irweCents: input.irweCents ?? 0,
        dacExcludedCents: input.dacExcludedCents ?? 0,
        level: pending.level,
        ssiCountable: input.ssiAdjustedCountableCents ?? countable,
        abdCountable: input.abdCountableCents ?? countable,
        waiverGross: input.waiverGrossCents ?? gross,
        mawdCountable: input.mawdCountableCents ?? countable,
        mawdJobSuccess: input.mawdJobSuccess ?? false,
        extraHelpIncome: input.extraHelpIncomeCents ?? countable,
      });
    if (await recentlyAlerted(input.beneficiaryId, pending.scenario.id, pending.level, Boolean(financialFinding))) {
      continue;
    }
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
      programs:
        pending.scenario.id === "reporting_wage_change_10day"
          ? wageReportPrograms
          : pending.scenario.programs.filter((program) => enrolledMatchesProgram(programSet, program)),
      financialFinding,
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
  if (await recentlyAlerted(input.beneficiaryId, scenario.id, scenario.level, false)) return null;
  return insertScenarioAlert({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: input.ownerUserId,
    actorUserId: input.actorUserId,
    scenario,
    monthPrefix: new Date().toISOString().slice(0, 7),
    changeConfidence: "confirmed",
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
  if (await recentlyAlerted(input.beneficiaryId, scenario.id, scenario.level, false)) return null;
  return insertScenarioAlert({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: input.ownerUserId,
    actorUserId: input.actorUserId,
    scenario,
    monthPrefix: new Date().toISOString().slice(0, 7),
    changeConfidence: "confirmed",
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
  changeConfidence?: "confirmed" | "inferred";
  /** Enrolled programs this alert actually applies to. The playbook list is the full catalog. */
  programs?: string[];
  financialFinding?: FinancialFinding;
}): Promise<Types.ObjectId> {
  const s = input.scenario;
  const level = input.level ?? (s.level === "info" ? "info" : s.level === "breach" ? "breach" : "warning");
  return createContinuityAlert({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: input.ownerUserId,
    actorUserId: input.actorUserId,
    level,
    trigger: s.trigger,
    message: alertMessage(s),
    dataSnapshot: {
      scenarioId: s.id,
      playbookId: s.id,
      title: s.title,
      programs: input.programs?.length ? input.programs : s.programs,
      monthPrefix: input.monthPrefix,
      earnedGrossCents: input.earnedGrossCents ?? 0,
      ssiCountableCents: input.ssiCountableCents ?? 0,
      maxAssetCents: input.maxAssetCents ?? 0,
      grossMonthlyCents: input.grossMonthlyCents ?? 0,
    },
    playbookId: s.id,
    eventSummary: s.risk,
    changeConfidence: input.changeConfidence ?? "inferred",
    activityDetails: { scenarioId: s.id, level, trigger: s.trigger },
    financialFinding: input.financialFinding,
  });
}

function findingForScenario(
  id: string,
  facts: {
    programs: string[];
    assets: number;
    gross: number;
    snapGross: number;
    householdSize: number;
    monthPrefix: string;
    observedAt: Date;
    irweCents: number;
    dacExcludedCents: number;
    level: "info" | "warning" | "breach";
    ssiCountable: number;
    abdCountable: number;
    waiverGross: number;
    mawdCountable: number;
    mawdJobSuccess: boolean;
    extraHelpIncome: number;
  },
): FinancialFinding | undefined {
  const level = facts.level === "breach" ? "breach" : "warning";
  switch (id) {
    case "qmb_resources":
      return qmbResourceFinding({
        countedCents: facts.assets,
        householdSize: facts.householdSize,
        monthPrefix: facts.monthPrefix,
      });
    case "snap_report_130_fpl":
      return snapReportingFinding({
        grossCents: facts.snapGross,
        householdSize: facts.householdSize,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
      });
    case "snap_elderly_resources":
      return snapElderlyResourceFinding({
        assetCents: facts.assets,
        grossCents: facts.snapGross,
        householdSize: facts.householdSize,
        monthPrefix: facts.monthPrefix,
        crossed: facts.level === "breach",
      });
    case "waiver_income_2982":
      return waiverIncomeFinding({
        programs: facts.programs,
        countableCents: facts.waiverGross,
        dacExcludedCents: facts.dacExcludedCents,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        level,
      });
    case "ssi_countable_income_fbr":
      return ssiIncomeFinding({
        countableCents: facts.ssiCountable,
        householdSize: facts.householdSize,
        irweCents: facts.irweCents,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        level,
      });
    case "abd_income_limit":
      return abdIncomeFinding({
        programs: facts.programs,
        countableCents: facts.abdCountable,
        dacExcludedCents: facts.dacExcludedCents,
        householdSize: facts.householdSize,
        irweCents: facts.irweCents,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        level,
      });
    case "mawd_income_limit":
      return mawdIncomeFinding({
        countableCents: facts.mawdCountable,
        householdSize: facts.householdSize,
        jobSuccess: facts.mawdJobSuccess,
        irweCents: facts.irweCents,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        level,
      });
    case "lucas_magi_income":
      return magiIncomeFinding({ grossCents: facts.gross, monthPrefix: facts.monthPrefix });
    case "extra_help_income":
      return extraHelpIncomeFinding({
        countableCents: facts.extraHelpIncome,
        householdSize: facts.householdSize,
        irweCents: facts.irweCents,
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        level,
      });
    case "extra_help_resources":
      return resourceScreenFinding({
        program: "ExtraHelp",
        countedCents: facts.assets,
        limitCents: extraHelpResourceLimitCents(facts.householdSize),
        limitLabel: "Extra Help resource limit",
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        crossed: facts.level === "breach",
        clock: true,
        clockSource: "An Extra Help-only case reports resource changes to SSA by the 10th of the next month.",
        action:
          "Report a resource change to SSA. Someone who has Medicaid, QMB, or SSI gets Extra Help automatically.",
        boundary: "Resources must be below this limit. An amount equal to the limit has reached it.",
      });
    case "ssi_resources_2k":
      return resourceScreenFinding({
        program: "SSI",
        countedCents: facts.assets,
        limitCents: ssiResourceLimitCents(facts.householdSize),
        limitLabel: "SSI resource limit",
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        crossed: facts.level === "breach",
        clock: true,
        clockSource: "SSI resource changes are due by the 10th of the month after the change.",
        action: "Report the resource change to SSA.",
      });
    case "waiver_resources_8k":
      return resourceScreenFinding({
        program: "MedicaidWaiver",
        countedCents: facts.assets,
        limitCents: WAIVER_RESOURCE_CENTS,
        limitLabel: "waiver resource limit",
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        crossed: facts.level === "breach",
        clock: true,
        clockSource: "Waiver resource changes are reported to the County Assistance Office within 10 days.",
        action: "Report this waiver resource change to the County Assistance Office. This action is for the waiver only.",
      });
    case "mawd_resources_10k":
      return resourceScreenFinding({
        program: "MAWD",
        countedCents: facts.assets,
        limitCents: MAWD_RESOURCE_CENTS,
        limitLabel: "MAWD resource limit",
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        crossed: facts.level === "breach",
        clock: true,
        clockSource: "MAWD resource changes are reported to the County Assistance Office within 10 days.",
        action: "Report this MAWD resource change to the County Assistance Office.",
      });
    case "abd_resources_2k":
      return resourceScreenFinding({
        program: "MedicaidABD",
        countedCents: facts.assets,
        limitCents: facts.householdSize >= 2 ? 3000_00 : 2000_00,
        limitLabel: "Healthy Horizons resource limit",
        monthPrefix: facts.monthPrefix,
        observedAt: facts.observedAt,
        crossed: facts.level === "breach",
        clock: true,
        clockSource: "Healthy Horizons resource changes are reported to the County Assistance Office within 10 days.",
        action: "Report this Healthy Horizons resource change to the County Assistance Office.",
      });
    default:
      return undefined;
  }
}
