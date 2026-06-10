import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity/log-activity";
import Alert from "@/lib/db/models/Alert";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Threshold from "@/lib/db/models/Threshold";
import Transaction from "@/lib/db/models/Transaction";
import { ensureSystemThresholdsSeeded } from "@/lib/thresholds/ensure-system-thresholds";
import {
  endOfUtcMonth,
  maxCheckingSavingsBalanceCents,
  projectRecurringEarnedRestOfMonthCents,
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
  if (systemKey === "ssi_resources_couple_2025") return householdSize >= 2;
  if (systemKey === "ssi_resources_individual_2025") return householdSize < 2;
  const snap = /^pa_snap_gross_hh(\d+)_/.exec(systemKey);
  if (snap) {
    const n = Number(snap[1]);
    return n >= 6 ? householdSize >= 6 : householdSize === n;
  }
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
  // System threshold `program` is stored uppercase; match case-insensitively.
  const programKeys = programs.map((p) => String(p).toUpperCase());
  if (programs.length === 0) {
    return { alertsCreated: 0, skippedNoPrograms: true, alertIdsCreated: [] };
  }

  const now = new Date();
  const { prefix, y, m } = utcMonthPrefix(now);
  const monthEnd = endOfUtcMonth(y, m);
  const benState = (beneficiary.state as string) ?? "";

  const [txRows, recurringRows, connections, thresholdRows] = await Promise.all([
    Transaction.find({ beneficiaryId: input.beneficiaryId })
      .select({ date: 1, amountCents: 1, userCategory: 1, pending: 1, excludedFromThresholds: 1 })
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
  const currentEarned = txSum;
  const projectedEarned = txSum + recurringExtra;

  const accountsFlat: { type: string; subtype?: string; currentBalanceCents: number }[] = [];
  for (const c of connections) {
    for (const a of c.accounts ?? []) {
      accountsFlat.push({
        type: a.type ?? "",
        subtype: a.subtype ?? "",
        currentBalanceCents: a.currentBalanceCents ?? 0,
      });
    }
  }
  const maxAsset = maxCheckingSavingsBalanceCents(accountsFlat);

  const householdSize = Math.max(1, beneficiary.householdSize ?? 1);
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

    let currentValue = 0;
    let projectedValue: number | null = null;

    switch (th.thresholdType) {
      case "monthly_earned_income":
        currentValue = currentEarned;
        projectedValue = projectedEarned;
        break;
      case "asset_balance":
        currentValue = maxAsset;
        projectedValue = null;
        break;
      default:
        continue;
    }

    const limitCents = th.limitCents as number;
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
      breach: `Reference limit for “${th.label}” may be reached based on current activity in CliffSense. This is informational only—confirm with SSA, SNAP, or a qualified benefits counselor before taking action.`,
      warn: `Activity is approaching a reference limit for “${th.label}”. Review recent deposits with a counselor; CliffSense does not determine eligibility.`,
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

  return { alertsCreated, skippedNoPrograms: false, alertIdsCreated };
}
