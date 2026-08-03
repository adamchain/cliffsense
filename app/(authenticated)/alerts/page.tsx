import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AlertsView } from "@/components/alerts/alerts-view";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import Transaction from "@/lib/db/models/Transaction";
import { connectDB } from "@/lib/db/mongodb";
import { buildReportingActions } from "@/lib/reporting/reporting-actions";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  const oid = primary?._id;

  let reportingActions: Awaited<ReturnType<typeof buildReportingActions>> = [];

  if (oid) {
    await connectDB();
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1))
      .toISOString()
      .slice(0, 10);

    const [payload, txns] = await Promise.all([
      loadThresholdDashboardPayload(oid),
      Transaction.find({ beneficiaryId: oid, date: { $gte: sixMonthsAgo } })
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
    });
  }

  return <AlertsView beneficiaryId={beneficiaryId} reportingActions={reportingActions} />;
}
