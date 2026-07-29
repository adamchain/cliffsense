import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity/log-activity";
import {
  ELIGIBILITY_LOSS_SCENARIOS,
  type EligibilityLossScenario,
} from "@/lib/alerts/eligibility-loss-scenarios";
import Alert from "@/lib/db/models/Alert";
import { SSI_FBR_INDIVIDUAL_CENTS } from "@/lib/benefits/ssi";

/** 2026 non-blind SGA and TWP service-month triggers (cents). */
const SGA_NONBLIND_CENTS = 1690_00;
const TWP_SERVICE_CENTS = 1210_00;
const ABD_INCOME_CENTS = 1350_00;
const WAIVER_INCOME_CENTS = 2982_00;
const QMB_INCOME_CENTS = 1350_00;
const EXTRA_HELP_INCOME_CENTS = 2015_00;
const SNAP_HH1_GROSS_CENTS = 2610_00;
const RESOURCE_2K_CENTS = 2000_00;

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
  monthPrefix: string;
};

function hasProgram(programs: string[], code: string): boolean {
  return programs.some((p) => p.toUpperCase() === code.toUpperCase());
}

function enrolledFor(scenario: EligibilityLossScenario, programSet: string[]): boolean {
  return scenario.programs.some((p) => {
    const u = p.toUpperCase();
    if (u === "EXTRAHELP") {
      return programSet.some((x) => x.includes("EXTRA") || x === "LIS" || x === "EXTRAHELP");
    }
    return programSet.includes(u);
  });
}

function alertMessage(s: EligibilityLossScenario): string {
  return `${s.title}: ${s.risk} ${s.action} Informational only — confirm with SSA, CAO, or a benefits counselor.`;
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
  const candidates: EligibilityLossScenario[] = [];

  const consider = (id: string) => {
    const s = ELIGIBILITY_LOSS_SCENARIOS.find((x) => x.id === id);
    if (!s?.autoDetect) return;
    if (!enrolledFor(s, programSet)) return;
    if (!candidates.some((c) => c.id === id)) candidates.push(s);
  };

  const earned = input.earnedGrossCents;
  const countable = input.ssiCountableCents;
  const assets = input.maxAssetCents;
  const gross = input.grossMonthlyCents;

  if (hasProgram(input.programs, "SSDI")) {
    if (earned >= SGA_NONBLIND_CENTS) consider("ssdi_sga_after_twp");
    else if (earned >= TWP_SERVICE_CENTS) consider("ssdi_twp_service_month");
  }
  if (hasProgram(input.programs, "DAC") && earned >= Math.floor(SGA_NONBLIND_CENTS * 0.85)) {
    consider("dac_sga_disability");
  }
  if (hasProgram(input.programs, "SSI")) {
    if (countable >= Math.floor(SSI_FBR_INDIVIDUAL_CENTS * 0.85)) consider("ssi_countable_income_fbr");
    if (assets > Math.floor(RESOURCE_2K_CENTS * 0.85)) consider("ssi_resources_2k");
  }
  if (hasProgram(input.programs, "Medicaid") || hasProgram(input.programs, "MAWD")) {
    if (countable >= Math.floor(ABD_INCOME_CENTS * 0.85) || gross >= Math.floor(ABD_INCOME_CENTS * 0.85)) {
      consider("abd_income_limit");
    }
    if (assets > Math.floor(RESOURCE_2K_CENTS * 0.85)) consider("abd_resources_2k");
    if (gross >= Math.floor(WAIVER_INCOME_CENTS * 0.85) || countable >= Math.floor(WAIVER_INCOME_CENTS * 0.85)) {
      consider("waiver_income_2982");
    }
    if (earned >= SGA_NONBLIND_CENTS && gross < WAIVER_INCOME_CENTS) {
      if (hasProgram(input.programs, "SSDI") || hasProgram(input.programs, "DAC")) {
        consider("ssdi_waiver_twilight");
      }
      consider("mawd_transition");
    }
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
  if (hasProgram(input.programs, "SNAP") && gross >= Math.floor(SNAP_HH1_GROSS_CENTS * 0.85)) {
    consider("snap_gross_200_fpl");
  }

  const prior = input.priorEarnedGrossCents ?? 0;
  if (prior > 0 && earned > prior * 1.1 && earned - prior >= 100_00) {
    consider("reporting_wage_change_10day");
  }

  const alertIdsCreated: Types.ObjectId[] = [];
  let alertsCreated = 0;

  for (const s of candidates) {
    if (await recentlyAlerted(input.beneficiaryId, s.id)) continue;
    const created = await Alert.create({
      beneficiaryId: input.beneficiaryId,
      userId: input.ownerUserId,
      thresholdId: null,
      level: s.level === "info" ? "info" : s.level === "breach" ? "breach" : "warning",
      trigger: s.trigger,
      message: alertMessage(s),
      dataSnapshot: {
        scenarioId: s.id,
        title: s.title,
        programs: s.programs,
        monthPrefix: input.monthPrefix,
        earnedGrossCents: earned,
        ssiCountableCents: countable,
        maxAssetCents: assets,
        grossMonthlyCents: gross,
      },
      status: "new",
    });
    alertsCreated += 1;
    alertIdsCreated.push(created._id as Types.ObjectId);
    await logActivity({
      userId: input.actorUserId,
      beneficiaryId: input.beneficiaryId,
      category: "alert",
      action: "alert.created",
      resourceType: "alert",
      resourceId: created._id.toString(),
      details: { scenarioId: s.id, level: s.level, trigger: s.trigger },
    });
  }

  return { alertsCreated, alertIdsCreated };
}
