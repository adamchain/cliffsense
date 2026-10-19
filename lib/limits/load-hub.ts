import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { buildReportingActions } from "@/lib/reporting/reporting-actions";
import { coercePolicyScreen, ageFromDateOfBirth } from "@/lib/policy/screen";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import type { LimitSources } from "@/lib/thresholds/limit-sources";
import { emptyLimitSources } from "@/lib/thresholds/limit-sources";
import { isSnapCategory, type SnapReportingCategory } from "@/lib/reporting/obligations";

export type LimitsHubData = {
  beneficiaryId: string | null;
  reportingActions: Awaited<ReturnType<typeof buildReportingActions>>;
  twpMonthsUsed: number;
  policyScreenInitial: ReturnType<typeof coercePolicyScreen>;
  limitSources: LimitSources;
  programRows: {
    program: string;
    nextRenewalDate?: Date | null;
    nextReviewDate?: Date | null;
    snapReportingCategory?: string | null;
  }[];
  snapCategory: SnapReportingCategory | null;
};

export async function loadLimitsHub(): Promise<LimitsHubData> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  await connectDB();
  const primary = await getActiveBeneficiaryForUser(session.user.id);

  const beneficiaryId = primary?._id.toString() ?? null;
  let reportingActions: LimitsHubData["reportingActions"] = [];
  let twpMonthsUsed = 0;
  let policyScreenInitial = coercePolicyScreen(null);
  let limitSources = emptyLimitSources();
  let programRows: LimitsHubData["programRows"] = [];

  if (primary?._id) {
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1))
      .toISOString()
      .slice(0, 10);
    const [payload, txns, twpDoc] = await Promise.all([
      loadThresholdDashboardPayload(primary._id),
      Transaction.find({ beneficiaryId: primary._id, date: { $gte: sixMonthsAgo } })
        .select({
          date: 1,
          amountCents: 1,
          userCategory: 1,
          name: 1,
          merchantName: 1,
          pending: 1,
          excludedFromThresholds: 1,
        })
        .lean(),
      Beneficiary.findById(primary._id)
        .select("twpMonthsUsed policyScreen dateOfBirth householdSize benefitsEnrolled")
        .lean(),
    ]);
    reportingActions = buildReportingActions({
      programs: payload.programsEnrolled,
      rows: payload.rows.map((r) => ({
        thresholdType: r.thresholdType,
        label: r.label,
        program: r.program,
        status: r.status,
        attached: r.attached,
      })),
      transactions: txns.map((t) => ({
        date: String(t.date),
        amountCents: Number(t.amountCents),
        userCategory: String(t.userCategory ?? ""),
        name: t.name ? String(t.name) : undefined,
        merchantName: t.merchantName ? String(t.merchantName) : undefined,
        pending: Boolean(t.pending),
        excludedFromThresholds: Boolean(t.excludedFromThresholds),
      })),
      now,
      householdSize: Number(twpDoc?.householdSize ?? 1),
    });
    twpMonthsUsed = Number(twpDoc?.twpMonthsUsed ?? 0);
    limitSources = payload.limitSources;
    programRows = (twpDoc?.benefitsEnrolled ?? []).map((b) => ({
      program: String(b.program),
      nextRenewalDate: b.nextRenewalDate as Date | null | undefined,
      nextReviewDate: b.nextReviewDate as Date | null | undefined,
      snapReportingCategory: (b.snapReportingCategory as string | null | undefined) ?? null,
    }));
    const ageFromDob = ageFromDateOfBirth(twpDoc?.dateOfBirth as Date | undefined);
    policyScreenInitial = coercePolicyScreen(twpDoc?.policyScreen, ageFromDob);
  }

  const category = programRows.find((b) => b.program === "SNAP")?.snapReportingCategory;
  return {
    beneficiaryId,
    reportingActions,
    twpMonthsUsed,
    policyScreenInitial,
    limitSources,
    programRows,
    snapCategory: isSnapCategory(category) ? category : null,
  };
}
