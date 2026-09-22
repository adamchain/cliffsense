import type { Types } from "mongoose";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Threshold from "@/lib/db/models/Threshold";
import Transaction from "@/lib/db/models/Transaction";
import { isMarriedStatus } from "@/lib/alerts/evaluate-scenario-alerts";
import { abdIncomeLimitCents, abdResourceLimitCents } from "@/lib/benefits/abd-limits";
import {
  enrolledWorkersWithJobSuccess,
  mawdIncomeLimitCents,
  mawdJobSuccessIncomeLimitCents,
} from "@/lib/benefits/mawd-limits";
import { magiAdultAgeApplies, magiAdultIncomeLimitCents } from "@/lib/benefits/magi-limits";
import { qmbIncomeBeforeGeneralExclusionCents, qmbIncomeLimitCents, qmbResourceLimitCents } from "@/lib/benefits/qmb-limits";
import { waiverGrossCountableCents } from "@/lib/benefits/waiver-limits";
import {
  abdCountableCents,
  adjustedSsiCountable,
  ssiBenefitCentsToExclude,
  studentEarnedIncomeExclusionCents,
} from "@/lib/benefits/ssi";
import { ageFromDateOfBirth } from "@/lib/policy/screen";
import { oneTimeOtherIncomeCents, passesSnapHouseholdRule, snapStoredGrossLimitCents } from "@/lib/benefits/snap-limits";
import { expandEnrolledProgramKeys } from "@/lib/programs";
import { ensureSystemThresholdsSeeded } from "@/lib/thresholds/ensure-system-thresholds";
import { reapplyAutoCategoriesForBeneficiary } from "@/lib/transactions/reapply-auto-categories";
import {
  endOfUtcMonth,
  grossMonthlyIncomeCents,
  grossUpEarnedCents,
  benefitDepositsInMonth,
  countableResourceBalanceCents,
  earnedNetBeforeMonthInYearCents,
  monthlyIncomeBreakdownCents,
  projectRecurringEarnedRestOfMonthCents,
  ssiCountableMonthlyIncomeCents,
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

export type ThresholdUiStatus = "ok" | "watch" | "concern";

export type ThresholdDashboardRow = {
  _id: string;
  scope: string;
  systemKey: string | null;
  attached: boolean;
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
  priorMonthPrefix: string;
  metrics: {
    currentEarnedIncomeCents: number;
    projectedEarnedIncomeCents: number;
    priorMonthEarnedIncomeCents: number;
    maxDepositoryBalanceCents: number;
  };
  rows: ThresholdDashboardRow[];
}> {
  await ensureSystemThresholdsSeeded();

  const emptyMetrics = {
    currentEarnedIncomeCents: 0,
    projectedEarnedIncomeCents: 0,
    priorMonthEarnedIncomeCents: 0,
    maxDepositoryBalanceCents: 0,
  };

  const beneficiary = await Beneficiary.findById(beneficiaryId).lean();
  if (!beneficiary) {
    return {
      programsEnrolled: [],
      monthPrefix: "",
      priorMonthPrefix: "",
      metrics: emptyMetrics,
      rows: [],
    };
  }

  const programs = (beneficiary.benefitsEnrolled ?? []).map((b) => b.program).filter(Boolean);
  const programKeys = expandEnrolledProgramKeys(programs);
  const now = new Date();
  const { prefix, y, m } = utcMonthPrefix(now);
  const priorPrefix = utcMonthPrefix(new Date(Date.UTC(y, m - 2, 15))).prefix;
  const monthEnd = endOfUtcMonth(y, m);
  const benState = (beneficiary.state as string) ?? "";
  const householdSize = Math.max(1, beneficiary.householdSize ?? 1);
  const detachedKeys = new Set<string>(
    (beneficiary.detachedThresholdKeys as string[] | undefined) ?? [],
  );

  if (programs.length === 0) {
    return {
      programsEnrolled: [],
      monthPrefix: prefix,
      priorMonthPrefix: priorPrefix,
      metrics: emptyMetrics,
      rows: [],
    };
  }

  // Re-tag payroll stuck as unclear/transfer (imports + Plaid TRANSFER_IN).
  await reapplyAutoCategoriesForBeneficiary(beneficiaryId);

  const [txRows, recurringRows, connections, thresholdRows] = await Promise.all([
    Transaction.find({
      beneficiaryId,
      date: {
        $gte: `${priorPrefix}-01` < `${y}-01-01` ? `${priorPrefix}-01` : `${y}-01-01`,
        $lte: `${prefix}-31`,
      },
    })
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

  const txMapped = txRows.map((t) => ({
    date: t.date,
    amountCents: t.amountCents,
    userCategory: t.userCategory,
    pending: Boolean(t.pending),
    excludedFromThresholds: Boolean(t.excludedFromThresholds),
    name: t.name ?? "",
    merchantName: t.merchantName ?? "",
  }));
  const txSum = sumEarnedInflowTransactionsCents(txMapped, prefix);
  const priorMonthEarned = sumEarnedInflowTransactionsCents(txMapped, priorPrefix);
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

  // Full income breakdown (earned / benefit / other) from the user's categorized
  // deposits, plus a projected view where earned income includes the rest-of-month
  // recurring payroll. Drives the gross- and countable-income limit valuations.
  const breakdown = monthlyIncomeBreakdownCents(txMapped, prefix);
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
  const age = ageFromDateOfBirth(beneficiary.dateOfBirth as Date | string | null | undefined, now);
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
  const excludeUnearnedCents = ssiBenefitCentsToExclude({ programs, householdSize, deposits: benefitDeposits });
  const projectedSsiCountable = ssiCountableMonthlyIncomeCents(projectedBreakdown, {
    excludeUnearnedCents,
    studentExclusionCents: studentEarnedIncomeExclusionCents({
      age,
      earnedGrossThisMonthCents: projectedBreakdown.earnedGrossCents,
      earnedGrossYearToDateBeforeMonthCents: ytdEarnedBefore,
    }),
  });
  const waiverGrossNow = waiverGrossCountableCents({ breakdown, programs, deposits: benefitDeposits });
  const waiverGrossProjected = waiverGrossCountableCents({
    breakdown: projectedBreakdown,
    programs,
    deposits: benefitDeposits,
  });
  const onSsi = programs.some((p) => String(p).toUpperCase() === "SSI");
  const mawdJobSuccess = enrolledWorkersWithJobSuccess(beneficiary.benefitsEnrolled ?? []);
  const married = isMarriedStatus((beneficiary.opening as { maritalStatus?: string } | null)?.maritalStatus);
  const abdIncomeNow = abdCountableCents({ breakdown, programs, householdSize, deposits: benefitDeposits });
  const abdIncomeProjected = abdCountableCents({
    breakdown: projectedBreakdown,
    programs,
    householdSize,
    deposits: benefitDeposits,
  });

  const rows: ThresholdDashboardRow[] = [];

  for (const th of thresholdRows) {
    if (!matchesState(th.state as string | null, benState)) continue;
    const sk = (th as { systemKey?: string }).systemKey;
    if (!passesHouseholdRule(sk, householdSize)) continue;
    const attached = !(th.scope === "system" && sk ? detachedKeys.has(sk) : false);

    let currentValue: number | null = null;
    let projectedValue: number | null = null;

    switch (th.thresholdType) {
      case "monthly_earned_income":
        // SSI/SGA earned-income limits are tested on GROSS wages.
        currentValue = breakdown.earnedGrossCents;
        projectedValue = projectedBreakdown.earnedGrossCents;
        break;
      case "monthly_gross_income":
        // SNAP gross-income test: wages, benefits, and recurring other income.
        // A one-time lump sum of $1,500 or more is left out.
        currentValue = grossMonthlyIncomeCents(breakdown);
        projectedValue = grossMonthlyIncomeCents(projectedBreakdown);
        if (String(th.program ?? "").toUpperCase() === "SNAP") {
          const lump = oneTimeOtherIncomeCents(txMapped, prefix);
          currentValue = Math.max(0, currentValue - lump);
          projectedValue = Math.max(0, (projectedValue ?? 0) - lump);
        }
        break;
      case "monthly_unearned_income":
        // ABD / QMB / Waiver "monthly income" limits use SSI countable-income
        // methodology ($20 general + $65 earned + ½ remaining earned).
        // The SSI row also drops the SSI payment itself and applies the student exclusion.
        if (String(th.program ?? "").toUpperCase() === "SSI") {
          currentValue = ssiAdjusted.countable;
          projectedValue = projectedSsiCountable;
        } else if (String(th.program ?? "").toUpperCase() === "MEDICAIDABD") {
          currentValue = abdIncomeNow;
          projectedValue = abdIncomeProjected;
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
        // annual_income / transaction_amount / custom: surfaced in the library
        // with their limit + source, but not auto-evaluated against a live metric.
        currentValue = null;
        projectedValue = null;
        break;
    }

    let limitCents = snapStoredGrossLimitCents(sk, th.limitCents as number, householdSize);
    if (sk === "pa_medicaid_abd_income_2026") {
      limitCents = abdIncomeLimitCents(householdSize);
    } else if (sk === "pa_medicaid_abd_resources_2026") {
      const resourceLimit = abdResourceLimitCents({
        householdSize,
        onWaiver: programs.some((p) => p.toUpperCase() === "MEDICAIDWAIVER"),
        age,
      });
      if (resourceLimit == null || programs.some((p) => String(p).toUpperCase() === "MEDICAIDWAIVER")) {
        currentValue = null;
        projectedValue = null;
      }
      if (resourceLimit != null) limitCents = resourceLimit;
    } else if (sk === "pa_waiver_income_2026") {
      if (onSsi) {
        currentValue = null;
        projectedValue = null;
      } else {
        currentValue = waiverGrossNow;
        projectedValue = waiverGrossProjected;
      }
    } else if (sk === "pa_waiver_resources_2026" && (onSsi || married)) {
      currentValue = null;
      projectedValue = null;
    } else if (sk === "pa_mawd_income_2026") {
      if (mawdJobSuccess) {
        currentValue = null;
        projectedValue = null;
      } else {
        limitCents = mawdIncomeLimitCents(householdSize);
      }
    } else if (sk === "pa_mawd_job_success_income_2026") {
      if (!mawdJobSuccess) {
        currentValue = null;
        projectedValue = null;
      } else {
        limitCents = mawdJobSuccessIncomeLimitCents(householdSize);
      }
    } else if (sk === "pa_mawd_resources_2026" && mawdJobSuccess) {
      currentValue = null;
      projectedValue = null;
    } else if (sk === "pa_medicaid_magi_adult_2026") {
      limitCents = magiAdultIncomeLimitCents(householdSize);
      if (onSsi || !magiAdultAgeApplies(age)) {
        currentValue = null;
        projectedValue = null;
      }
    } else if (sk === "pa_qmb_income_2026") {
      limitCents = qmbIncomeLimitCents(householdSize);
      currentValue = qmbIncomeBeforeGeneralExclusionCents(breakdown);
      projectedValue = qmbIncomeBeforeGeneralExclusionCents(projectedBreakdown);
    } else if (sk === "pa_qmb_resources_2026") {
      limitCents = qmbResourceLimitCents(householdSize);
    }
    const warnAt = typeof th.warnAtPercent === "number" ? th.warnAtPercent : 0.85;
    const isAsset = th.thresholdType === "asset_balance";
    let breachNow = isAsset
      ? assetBreach(currentValue ?? 0, limitCents)
      : incomeBreach(currentValue ?? 0, limitCents);
    let warnNow = isAsset
      ? assetWarn(currentValue ?? 0, limitCents, warnAt)
      : incomeWarn(currentValue ?? 0, limitCents, warnAt);
    let predictive =
      projectedValue != null &&
      !isAsset &&
      incomeBreach(projectedValue, limitCents) &&
      !breachNow;
    if (sk === "pa_waiver_income_2026" || sk === "pa_medicaid_magi_adult_2026" || sk === "pa_qmb_income_2026") {
      const value = currentValue ?? 0;
      breachNow = value > limitCents;
      warnNow = value >= Math.floor(limitCents * warnAt) && value <= limitCents;
      predictive = projectedValue != null && projectedValue > limitCents && !breachNow;
    }

    let status: ThresholdUiStatus = "ok";
    if (!attached) status = "ok"; // detached limits are not evaluated
    else if (breachNow) status = "concern";
    else if (predictive || warnNow) status = "watch";

    rows.push({
      _id: String(th._id),
      scope: th.scope as string,
      systemKey: sk ?? null,
      attached,
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
    priorMonthPrefix: priorPrefix,
    metrics: {
      currentEarnedIncomeCents: currentEarned,
      projectedEarnedIncomeCents: projectedEarned,
      priorMonthEarnedIncomeCents: priorMonthEarned,
      maxDepositoryBalanceCents: maxAsset,
    },
    rows,
  };
}
