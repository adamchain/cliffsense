import type { Types } from "mongoose";
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

export type ThresholdUiStatus = "ok" | "watch" | "concern";

export type ThresholdDashboardRow = {
  _id: string;
  scope: string;
  program: string | null;
  thresholdType: string;
  label: string;
  description: string;
  sourceUrl: string;
  limitCents: number;
  warnAtPercent: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  currentValueCents: number | null;
  projectedValueCents: number | null;
  status: ThresholdUiStatus;
};

export async function loadThresholdDashboardPayload(beneficiaryId: Types.ObjectId): Promise<{
  programsEnrolled: string[];
  monthPrefix: string;
  metrics: {
    currentEarnedIncomeCents: number;
    projectedEarnedIncomeCents: number;
    maxDepositoryBalanceCents: number;
  };
  rows: ThresholdDashboardRow[];
}> {
  await ensureSystemThresholdsSeeded();

  const beneficiary = await Beneficiary.findById(beneficiaryId).lean();
  if (!beneficiary) {
    return {
      programsEnrolled: [],
      monthPrefix: "",
      metrics: { currentEarnedIncomeCents: 0, projectedEarnedIncomeCents: 0, maxDepositoryBalanceCents: 0 },
      rows: [],
    };
  }

  const programs = (beneficiary.benefitsEnrolled ?? []).map((b) => b.program).filter(Boolean);
  // System threshold `program` is stored uppercase; match case-insensitively.
  const programKeys = programs.map((p) => String(p).toUpperCase());
  const now = new Date();
  const { prefix, y, m } = utcMonthPrefix(now);
  const monthEnd = endOfUtcMonth(y, m);
  const benState = (beneficiary.state as string) ?? "";
  const householdSize = Math.max(1, beneficiary.householdSize ?? 1);

  if (programs.length === 0) {
    return {
      programsEnrolled: [],
      monthPrefix: prefix,
      metrics: { currentEarnedIncomeCents: 0, projectedEarnedIncomeCents: 0, maxDepositoryBalanceCents: 0 },
      rows: [],
    };
  }

  const [txRows, recurringRows, connections, thresholdRows] = await Promise.all([
    Transaction.find({
      beneficiaryId,
      date: { $gte: `${prefix}-01`, $lte: `${prefix}-31` },
    })
      .select({ date: 1, amountCents: 1, userCategory: 1, pending: 1, excludedFromThresholds: 1 })
      .lean(),
    RecurringStream.find({ beneficiaryId })
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
    BankConnection.find({ beneficiaryId, status: "active" }).select({ accounts: 1 }).lean(),
    Threshold.find({
      $and: [
        {
          $or: [{ scope: "system", program: { $in: programKeys } }, { scope: "user", beneficiaryId }],
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

  const rows: ThresholdDashboardRow[] = [];

  for (const th of thresholdRows) {
    if (!matchesState(th.state as string | null, benState)) continue;
    const sk = (th as { systemKey?: string }).systemKey;
    if (!passesHouseholdRule(sk, householdSize)) continue;

    let currentValue: number | null = null;
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
        // Reference-only types (unearned/annual/custom): surfaced in the library
        // with their limit + source, but not auto-evaluated against a live metric.
        currentValue = null;
        projectedValue = null;
        break;
    }

    const limitCents = th.limitCents as number;
    const warnAt = typeof th.warnAtPercent === "number" ? th.warnAtPercent : 0.85;
    const isAsset = th.thresholdType === "asset_balance";
    const breachNow = isAsset
      ? assetBreach(currentValue ?? 0, limitCents)
      : incomeBreach(currentValue ?? 0, limitCents);
    const warnNow = isAsset
      ? assetWarn(currentValue ?? 0, limitCents, warnAt)
      : incomeWarn(currentValue ?? 0, limitCents, warnAt);
    const predictive =
      projectedValue != null &&
      !isAsset &&
      incomeBreach(projectedValue, limitCents) &&
      !breachNow;

    let status: ThresholdUiStatus = "ok";
    if (breachNow) status = "concern";
    else if (predictive || warnNow) status = "watch";

    rows.push({
      _id: String(th._id),
      scope: th.scope as string,
      program: (th.program as string | null) ?? null,
      thresholdType: th.thresholdType as string,
      label: th.label as string,
      description: (th.description as string) ?? "",
      sourceUrl: (th.sourceUrl as string) ?? "",
      limitCents,
      warnAtPercent: warnAt,
      effectiveFrom: (th.effectiveFrom as Date).toISOString(),
      effectiveTo: th.effectiveTo ? (th.effectiveTo as Date).toISOString() : null,
      currentValueCents: currentValue,
      projectedValueCents: projectedValue,
      status,
    });
  }

  return {
    programsEnrolled: programs as string[],
    monthPrefix: prefix,
    metrics: {
      currentEarnedIncomeCents: currentEarned,
      projectedEarnedIncomeCents: projectedEarned,
      maxDepositoryBalanceCents: maxAsset,
    },
    rows,
  };
}
