import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity/log-activity";
import Alert from "@/lib/db/models/Alert";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Threshold from "@/lib/db/models/Threshold";
import Transaction from "@/lib/db/models/Transaction";
import { evaluateScenarioAlerts, isMarriedStatus } from "@/lib/alerts/evaluate-scenario-alerts";
import {
  abdCountableCents,
  adjustedSsiCountable,
  isSntCashDeposit,
  ssiBenefitCentsToExclude,
  studentEarnedIncomeExclusionCents,
} from "@/lib/benefits/ssi";
import { enrolledWorkersWithJobSuccess } from "@/lib/benefits/mawd-limits";
import { waiverGrossCountableCents } from "@/lib/benefits/waiver-limits";
import { ageFromDateOfBirth } from "@/lib/policy/screen";
import {
  isSubstantialGamblingWin,
  oneTimeOtherIncomeCents,
  passesSnapHouseholdRule,
  snapStoredGrossLimitCents,
} from "@/lib/benefits/snap-limits";
import { playbookIdForThreshold } from "@/lib/alerts/alert-playbook";
import { expandEnrolledProgramKeys } from "@/lib/programs";
import { ensureSystemThresholdsSeeded } from "@/lib/thresholds/ensure-system-thresholds";
import { reapplyAutoCategoriesForBeneficiary } from "@/lib/transactions/reapply-auto-categories";
import {
  endOfUtcMonth,
  grossMonthlyIncomeCents,
  grossUpEarnedCents,
  ableAccountBalanceCents,
  benefitDepositsInMonth,
  countableResourceBalanceCents,
  earnedNetBeforeMonthInYearCents,
  monthlyIncomeBreakdownCents,
  projectRecurringEarnedRestOfMonthCents,
  ssiCountableMonthlyIncomeCents,
  sumEarnedInflowTransactionsCents,
  utcMonthPrefix,
} from "@/lib/thresholds/metrics";

const LEVEL_RANK: Record<string, number> = { info: 0, warning: 1, breach: 2 };

function levelRank(level: string): number {
  return LEVEL_RANK[level] ?? 0;
}

function matchesState(thresholdState: string | null | undefined, beneficiaryState: string): boolean {
  const s = (thresholdState ?? "").trim();
  if (!s) return true;
  return s === (beneficiaryState ?? "").trim().toUpperCase();
}

function passesHouseholdRule(systemKey: string | undefined, householdSize: number): boolean {
  if (!systemKey) return true;
  if (systemKey === "ssi_resources_couple_2025" || systemKey === "ssi_countable_income_couple_2026") {
    return householdSize >= 2;
  }
  if (systemKey === "ssi_resources_individual_2025" || systemKey === "ssi_countable_income_2026") {
    return householdSize < 2;
  }
  const snapHousehold = passesSnapHouseholdRule(systemKey, householdSize);
  if (snapHousehold != null) return snapHousehold;
  return true;
}

function incomeBreach(value: number, limitCents: number): boolean {
  return value >= limitCents;
}

function incomeWarn(value: number, limitCents: number, warnAt: number): boolean {
  return value >= Math.floor(limitCents * warnAt);
}

function assetBreach(value: number, limitCents: number): boolean {
  return value > limitCents;
}

function assetWarn(value: number, limitCents: number, warnAt: number): boolean {
  return value > Math.floor(limitCents * warnAt);
}

async function shouldSkipAlert(
  beneficiaryId: Types.ObjectId,
  thresholdId: Types.ObjectId,
  trigger: string,
  level: "info" | "warning" | "breach",
): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86400000);
  const recent = await Alert.findOne({
    beneficiaryId,
    thresholdId,
    trigger,
    status: { $in: ["new", "acknowledged"] },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!recent) return false;
  if (levelRank(level) > levelRank(recent.level as string)) return false;
  return true;
}

export type EvaluateThresholdsResult = {
  alertsCreated: number;
  skippedNoPrograms: boolean;
  /** ObjectIds of alerts inserted this run (for email dispatch). */
  alertIdsCreated: Types.ObjectId[];
};

/**
 * Loads applicable thresholds, computes reference metrics, and inserts de-duplicated alerts.
 * Intended to run after bank sync; email is handled separately.
 */
export async function evaluateThresholdsForBeneficiary(input: {
  beneficiaryId: Types.ObjectId;
  actorUserId: string;
}): Promise<EvaluateThresholdsResult> {
  await ensureSystemThresholdsSeeded();

  const beneficiary = await Beneficiary.findById(input.beneficiaryId).lean();
  if (!beneficiary) {
    return { alertsCreated: 0, skippedNoPrograms: true, alertIdsCreated: [] };
  }

  const programs = (beneficiary.benefitsEnrolled ?? []).map((b) => b.program).filter(Boolean);
  const programKeys = expandEnrolledProgramKeys(programs);
  if (programs.length === 0) {
    return { alertsCreated: 0, skippedNoPrograms: true, alertIdsCreated: [] };
  }

  const now = new Date();
  const { prefix, y, m } = utcMonthPrefix(now);
  const monthEnd = endOfUtcMonth(y, m);
  const benState = (beneficiary.state as string) ?? "";

  // Re-tag payroll/benefits stuck as transfer/unclear before metrics run.
  await reapplyAutoCategoriesForBeneficiary(input.beneficiaryId);

  const [txRows, recurringRows, connections, thresholdRows] = await Promise.all([
    Transaction.find({ beneficiaryId: input.beneficiaryId })
      .select({
        date: 1,
        amountCents: 1,
        userCategory: 1,
        pending: 1,
        excludedFromThresholds: 1,
        name: 1,
        merchantName: 1,
      })
      .lean(),
    RecurringStream.find({ beneficiaryId: input.beneficiaryId })
      .select({
        type: 1,
        userCategory: 1,
        isConfirmed: 1,
        frequency: 1,
        averageAmountCents: 1,
        predictedNextDate: 1,
        excludedFromThresholds: 1,
      })
      .lean(),
    BankConnection.find({ beneficiaryId: input.beneficiaryId, status: "active" })
      .select({ accounts: 1 })
      .lean(),
    Threshold.find({
      $and: [
        {
          $or: [
            { scope: "system", program: { $in: programKeys } },
            { scope: "user", beneficiaryId: input.beneficiaryId },
          ],
        },
        { effectiveFrom: { $lte: now } },
        { $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }] },
      ],
    }).lean(),
  ]);

  const txSum = sumEarnedInflowTransactionsCents(
    txRows.map((t) => ({
      date: t.date,
      amountCents: t.amountCents,
      userCategory: t.userCategory,
      pending: Boolean(t.pending),
      excludedFromThresholds: Boolean(t.excludedFromThresholds),
    })),
    prefix,
  );
  const recurringExtra = projectRecurringEarnedRestOfMonthCents(
    recurringRows.map((r) => ({
      type: r.type,
      userCategory: r.userCategory,
      isConfirmed: Boolean(r.isConfirmed),
      frequency: r.frequency,
      averageAmountCents: r.averageAmountCents,
      predictedNextDate: r.predictedNextDate ?? "",
      excludedFromThresholds: Boolean(r.excludedFromThresholds),
    })),
    now,
    monthEnd,
  );
  const projectedEarned = txSum + recurringExtra;

  const breakdown = monthlyIncomeBreakdownCents(
    txRows.map((t) => ({
      date: t.date,
      amountCents: t.amountCents,
      userCategory: t.userCategory,
      pending: Boolean(t.pending),
      excludedFromThresholds: Boolean(t.excludedFromThresholds),
    })),
    prefix,
  );
  const projectedBreakdown = {
    ...breakdown,
    earnedNetCents: projectedEarned,
    earnedGrossCents: grossUpEarnedCents(projectedEarned),
  };

  const accountsFlat: { type: string; subtype?: string; name?: string; currentBalanceCents: number }[] = [];
  for (const c of connections) {
    for (const a of c.accounts ?? []) {
      accountsFlat.push({
        type: a.type ?? "",
        subtype: a.subtype ?? "",
        name: a.name ?? "",
        currentBalanceCents: a.currentBalanceCents ?? 0,
      });
    }
  }
  const maxAsset = countableResourceBalanceCents(accountsFlat);
  const ableBalanceCents = ableAccountBalanceCents(accountsFlat);

  const householdSize = Math.max(1, beneficiary.householdSize ?? 1);
  const age = ageFromDateOfBirth(beneficiary.dateOfBirth as Date | string | null | undefined, now);
  const txMapped = txRows.map((t) => ({
    date: t.date,
    amountCents: t.amountCents,
    userCategory: t.userCategory,
    pending: Boolean(t.pending),
    excludedFromThresholds: Boolean(t.excludedFromThresholds),
    name: t.name ?? "",
    merchantName: t.merchantName ?? "",
  }));
  const benefitDeposits = benefitDepositsInMonth(txMapped, prefix);
  const ytdEarnedBefore = grossUpEarnedCents(earnedNetBeforeMonthInYearCents(txMapped, prefix));
  const ssiAdjusted = adjustedSsiCountable({
    breakdown,
    programs,
    householdSize,
    benefitDeposits,
    age,
    earnedGrossYearToDateBeforeMonthCents: ytdEarnedBefore,
  });
  const excludeUnearnedCents = ssiBenefitCentsToExclude({
    programs,
    householdSize,
    deposits: benefitDeposits,
  });
  const projectedStudentExclusion = studentEarnedIncomeExclusionCents({
    age,
    earnedGrossThisMonthCents: projectedBreakdown.earnedGrossCents,
    earnedGrossYearToDateBeforeMonthCents: ytdEarnedBefore,
  });
  const projectedSsiCountable = ssiCountableMonthlyIncomeCents(projectedBreakdown, {
    excludeUnearnedCents,
    studentExclusionCents: projectedStudentExclusion,
  });
  const sntCashDeposit = txMapped.some(
    (t) =>
      t.date.startsWith(prefix) &&
      t.amountCents < 0 &&
      !t.pending &&
      !t.excludedFromThresholds &&
      isSntCashDeposit(t.name, t.merchantName),
  );
  const detachedKeys = new Set<string>(
    (beneficiary.detachedThresholdKeys as string[] | undefined) ?? [],
  );

  let alertsCreated = 0;
  const alertIdsCreated: Types.ObjectId[] = [];

  for (const th of thresholdRows) {
    if (!matchesState(th.state as string | null, benState)) continue;
    const sk = (th as { systemKey?: string }).systemKey;
    if (!passesHouseholdRule(sk, householdSize)) continue;
    // Skip system limits the user has detached — they should not fire alerts.
    if (th.scope === "system" && sk && detachedKeys.has(sk)) continue;
    // SSDI TWP and SGA alerts come from the scenario, which knows how many TWP months are recorded.
    // The blind SGA figure stays a reference until statutory blindness is recorded.
    if (sk === "ssdi_twp_2026" || sk === "ssdi_sga_nonblind_2026" || sk === "ssdi_sga_blind_2026") continue;
    // Healthy Horizons income and resources depend on household size, waiver enrollment, and age.
    // The scenario owns those alerts so a couple is not tested against the one-person seed.
    if (sk === "pa_medicaid_abd_income_2026" || sk === "pa_medicaid_abd_resources_2026") continue;
    // Waiver income is a gross test, and neither limit applies while the person receives SSI.
    // A married waiver resource share is set at assessment, so the $8,000 seed must not alert on its own.
    if (sk === "pa_waiver_income_2026" || sk === "pa_waiver_resources_2026") continue;
    // MAWD income depends on household size and whether Workers with Job Success is recorded.
    if (
      sk === "pa_mawd_income_2026" ||
      sk === "pa_mawd_resources_2026" ||
      sk === "pa_mawd_job_success_income_2026"
    ) {
      continue;
    }
    // Adult MAGI income depends on household size. The scenario also skips SSI and ages outside 19–64.
    if (sk === "pa_medicaid_magi_adult_2026") continue;

    let currentValue = 0;
    let projectedValue: number | null = null;

    switch (th.thresholdType) {
      case "monthly_earned_income":
        currentValue = breakdown.earnedGrossCents;
        projectedValue = projectedBreakdown.earnedGrossCents;
        break;
      case "monthly_gross_income":
        currentValue = grossMonthlyIncomeCents(breakdown);
        projectedValue = grossMonthlyIncomeCents(projectedBreakdown);
        if (String(th.program ?? "").toUpperCase() === "SNAP") {
          const lump = oneTimeOtherIncomeCents(txMapped, prefix);
          currentValue = Math.max(0, currentValue - lump);
          projectedValue = Math.max(0, (projectedValue ?? 0) - lump);
        }
        break;
      case "monthly_unearned_income":
        if (String(th.program ?? "").toUpperCase() === "SSI") {
          currentValue = ssiAdjusted.countable;
          projectedValue = projectedSsiCountable;
        } else {
          currentValue = ssiCountableMonthlyIncomeCents(breakdown);
          projectedValue = ssiCountableMonthlyIncomeCents(projectedBreakdown);
        }
        break;
      case "asset_balance":
        currentValue = maxAsset;
        projectedValue = null;
        break;
      default:
        continue;
    }

    const limitCents = snapStoredGrossLimitCents(sk, th.limitCents as number, householdSize);
    const warnAt = typeof th.warnAtPercent === "number" ? th.warnAtPercent : 0.85;

    const isAsset = th.thresholdType === "asset_balance";
    const breachNow = isAsset ? assetBreach(currentValue, limitCents) : incomeBreach(currentValue, limitCents);
    const warnNow = isAsset ? assetWarn(currentValue, limitCents, warnAt) : incomeWarn(currentValue, limitCents, warnAt);
    const predictive =
      projectedValue != null &&
      !isAsset &&
      incomeBreach(projectedValue, limitCents) &&
      !breachNow;

    const messages = {
      breach: `Reference limit for “${th.label}” may be reached based on current activity in BeneWatch. This is informational only—confirm with SSA, SNAP, or a qualified benefits counselor before taking action.`,
      warn: `Activity is approaching a reference limit for “${th.label}”. Review recent deposits with a counselor; BeneWatch does not determine eligibility.`,
      predictive: `Based on recurring patterns this month, gross earned activity could approach “${th.label}” before month-end. Confirm details with SSA or a representative.`,
    };

    const candidates: {
      level: "info" | "warning" | "breach";
      trigger: "breach" | "predictive" | "trend";
      message: string;
    }[] = [];

    if (breachNow) {
      candidates.push({ level: "breach", trigger: "breach", message: messages.breach });
    } else if (predictive) {
      candidates.push({ level: "warning", trigger: "predictive", message: messages.predictive });
    } else if (warnNow) {
      candidates.push({ level: "warning", trigger: "trend", message: messages.warn });
    }

    for (const c of candidates) {
      if (await shouldSkipAlert(input.beneficiaryId, th._id, c.trigger, c.level)) continue;

      const created = await Alert.create({
        beneficiaryId: input.beneficiaryId,
        userId: beneficiary.ownerUserId,
        thresholdId: th._id,
        level: c.level,
        trigger: c.trigger,
        message: c.message,
        dataSnapshot: {
          thresholdLabel: th.label,
          thresholdType: th.thresholdType,
          program: th.program,
          playbookId: playbookIdForThreshold(String(th.program), String(th.thresholdType)),
          limitCents,
          currentValueCents: currentValue,
          projectedValueCents: projectedValue,
          monthPrefix: prefix,
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
        details: {
          thresholdId: th._id.toString(),
          level: c.level,
          trigger: c.trigger,
        },
      });
    }
  }

  // Scenario-specific cliffs (SGA, ISM education via wage jumps, waiver twilight, …)
  const priorMonthDate = new Date(Date.UTC(y, m - 2, 15));
  const priorPrefix = utcMonthPrefix(priorMonthDate).prefix;
  const priorEarnedNet = sumEarnedInflowTransactionsCents(txMapped, priorPrefix);
  const earnedDeposits = txRows.flatMap((t) => {
    if (t.pending || t.excludedFromThresholds) return [];
    if (t.userCategory !== "earned_income" || t.amountCents >= 0) return [];
    const payerKey = String(t.merchantName || t.name || "")
      .trim()
      .toLowerCase();
    return [{ date: String(t.date), amountCents: Math.abs(t.amountCents), payerKey }];
  });
  const scenarioResult = await evaluateScenarioAlerts({
    beneficiaryId: input.beneficiaryId,
    ownerUserId: beneficiary.ownerUserId,
    actorUserId: input.actorUserId,
    programs,
    earnedGrossCents: breakdown.earnedGrossCents,
    priorEarnedGrossCents: grossUpEarnedCents(priorEarnedNet),
    ssiCountableCents: ssiCountableMonthlyIncomeCents(breakdown),
    ssiAdjustedCountableCents: ssiAdjusted.countable,
    ssiUnearnedOnlyCents: ssiAdjusted.unearnedOnly,
    abdCountableCents: abdCountableCents({
      breakdown,
      programs,
      householdSize,
      deposits: benefitDeposits,
    }),
    waiverGrossCents: waiverGrossCountableCents({
      breakdown,
      programs,
      deposits: benefitDeposits,
    }),
    married: isMarriedStatus((beneficiary.opening as { maritalStatus?: string } | null)?.maritalStatus),
    mawdCountableCents: ssiCountableMonthlyIncomeCents(breakdown),
    mawdJobSuccess: enrolledWorkersWithJobSuccess(beneficiary.benefitsEnrolled ?? []),
    maxAssetCents: maxAsset,
    ableBalanceCents,
    sntCashDeposit,
    dateOfBirth: (beneficiary.dateOfBirth as Date | string | null | undefined) ?? null,
    grossMonthlyCents: grossMonthlyIncomeCents(breakdown),
    snapGrossCents: Math.max(0, grossMonthlyIncomeCents(breakdown) - oneTimeOtherIncomeCents(txMapped, prefix)),
    substantialGamblingWin: isSubstantialGamblingWin(
      txMapped
        .filter(
          (t) =>
            t.date.startsWith(prefix) &&
            t.amountCents < 0 &&
            !t.pending &&
            !t.excludedFromThresholds,
        )
        .map((t) => ({ amountCents: Math.abs(t.amountCents), name: `${t.name ?? ""} ${t.merchantName ?? ""}` })),
    ),
    otherInflowCents: breakdown.otherCents,
    monthPrefix: prefix,
    earnedDeposits,
    hasHistoryBeforeMonth: txRows.some((t) => String(t.date).slice(0, 7) < prefix),
    householdSize,
    twpMonthsUsed: Number(beneficiary.twpMonthsUsed ?? 0),
    now,
  });
  alertsCreated += scenarioResult.alertsCreated;
  alertIdsCreated.push(...scenarioResult.alertIdsCreated);

  return { alertsCreated, skippedNoPrograms: false, alertIdsCreated };
}
