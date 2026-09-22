import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import { ProgramsForm } from "@/app/(authenticated)/settings/programs-form";
import { AlertsView } from "@/components/alerts/alerts-view";
import { ThresholdsView } from "@/components/thresholds/thresholds-view";
import { WorkPlanner } from "@/components/benefits/work-planner";
import { PolicyScreen } from "@/components/policy/policy-screen";
import { BenefitsHubNav } from "@/components/settings/benefits-hub-nav";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { buildReportingActions } from "@/lib/reporting/reporting-actions";
import { coercePolicyScreen, ageFromDateOfBirth } from "@/lib/policy/screen";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";

const sectionCls = "scroll-mt-28";

export default async function LimitsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  await connectDB();
  const [ownerBen, primary] = await Promise.all([
    Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
      .select("benefitsEnrolled")
      .lean(),
    getActiveBeneficiaryForUser(session.user.id),
  ]);

  const beneficiaryId = primary?._id.toString() ?? null;
  let reportingActions: Awaited<ReturnType<typeof buildReportingActions>> = [];
  let twpMonthsUsed = 0;
  let policyScreenInitial = coercePolicyScreen(null);
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
      Beneficiary.findById(primary._id).select("twpMonthsUsed policyScreen dateOfBirth householdSize").lean(),
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
    const ageFromDob = ageFromDateOfBirth(twpDoc?.dateOfBirth as Date | undefined);
    policyScreenInitial = coercePolicyScreen(twpDoc?.policyScreen, ageFromDob);
  }

  return (
    <div>
      <h1 className="cs-big-title mb-1">Limits &amp; alerts</h1>
      <p className="mb-3 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Watch limits, review alerts, choose programs, and check 2026–27 policy — all in one place.
      </p>

      <BenefitsHubNav />

      <div className="space-y-10">
        <section id="alerts" className={sectionCls}>
          <AlertsView
            beneficiaryId={beneficiaryId}
            reportingActions={reportingActions}
            embedded
          />
        </section>

        <section id="limits" className={sectionCls}>
          <ThresholdsView beneficiaryId={beneficiaryId} embedded />
          <WorkPlanner
            beneficiaryId={beneficiaryId}
            initialTwpMonths={twpMonthsUsed}
          />
        </section>

        <section id="policy" className={sectionCls}>
          <PolicyScreen beneficiaryId={beneficiaryId} initial={policyScreenInitial} />
        </section>

        {ownerBen && (
          <section id="programs" className={sectionCls}>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-[var(--color-cs-text)]">
              Programs
            </h2>
            <p className="mb-3 text-[13px] text-[var(--color-cs-text-secondary)]">
              Choose what you receive so the right limits and alerts attach.
            </p>
            <div className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <ProgramsForm
                beneficiaryId={ownerBen._id.toString()}
                initialPrograms={(ownerBen.benefitsEnrolled ?? []).map((b) => b.program)}
                initialRenewals={Object.fromEntries(
                  (ownerBen.benefitsEnrolled ?? []).map((b) => [
                    b.program,
                    b.nextRenewalDate
                      ? new Date(b.nextRenewalDate as Date).toISOString().slice(0, 10)
                      : null,
                  ]),
                )}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
