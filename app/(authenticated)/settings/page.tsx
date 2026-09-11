import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import { SettingsForm } from "./settings-form";
import { ProgramsForm } from "./programs-form";
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountButton } from "./delete-account-button";
import { PushToggle } from "@/components/push/push-toggle";
import { AlertsView } from "@/components/alerts/alerts-view";
import { ThresholdsView } from "@/components/thresholds/thresholds-view";
import { WorkPlanner } from "@/components/benefits/work-planner";
import { BenefitsHubNav } from "@/components/settings/benefits-hub-nav";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { buildReportingActions } from "@/lib/reporting/reporting-actions";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";

const sectionCls = "scroll-mt-28";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  await connectDB();
  const [user, ownerBen, primary] = await Promise.all([
    User.findById(session.user.id).select("name email accountType notificationPrefs onboardingStep").lean(),
    Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
      .select("firstName lastName state county householdSize benefitsEnrolled")
      .lean(),
    getActiveBeneficiaryForUser(session.user.id),
  ]);

  if (!user) {
    redirect("/auth/signin");
  }

  const beneficiaryId = primary?._id.toString() ?? null;
  let reportingActions: Awaited<ReturnType<typeof buildReportingActions>> = [];
  let twpMonthsUsed = 0;
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
      Beneficiary.findById(primary._id).select("twpMonthsUsed").lean(),
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
    twpMonthsUsed = Number(twpDoc?.twpMonthsUsed ?? 0);
  }

  const initials = (user.name ?? user.email ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div>
      <h1 className="cs-big-title mb-1">Limits &amp; alerts</h1>
      <p className="mb-3 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Watch limits, review alerts, choose programs, and set who gets notified — all in one place.
      </p>

      <BenefitsHubNav />

      <Link
        href="/beneficiaries"
        className="mb-6 flex items-center gap-3.5 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3f6fc4] to-[#2b5797] text-[22px] font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[20px] font-semibold tracking-tight text-[var(--color-cs-text)]">
            {user.name || "Your account"}
          </div>
          <div className="truncate text-[13.5px] text-[var(--color-cs-text-secondary)]">
            {user.email} · {user.accountType}
          </div>
        </div>
        <span className="shrink-0 text-[18px] text-[var(--color-cs-text-muted)]" aria-hidden>
          ›
        </span>
      </Link>

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

        <section id="profile" className={sectionCls}>
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-[var(--color-cs-text)]">
            Profile &amp; notifications
          </h2>
          <div className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <SettingsForm
              initialName={user.name ?? ""}
              initialFrequency={user.notificationPrefs?.frequency ?? "daily"}
              initialNotifyEmail={user.notificationPrefs?.email ?? ""}
              initialAlertTypes={{
                predictive: user.notificationPrefs?.alertTypes?.predictive ?? true,
                breach: user.notificationPrefs?.alertTypes?.breach ?? true,
                trend: user.notificationPrefs?.alertTypes?.trend ?? true,
                cliff: user.notificationPrefs?.alertTypes?.cliff ?? true,
                reporting: user.notificationPrefs?.alertTypes?.reporting ?? true,
                snt: user.notificationPrefs?.alertTypes?.snt ?? true,
                able: user.notificationPrefs?.alertTypes?.able ?? true,
              }}
              initialAdditionalEmails={user.notificationPrefs?.additionalEmails ?? []}
              initialState={ownerBen?.state ?? ""}
              initialHouseholdSize={ownerBen?.householdSize ?? 1}
            />
          </div>
        </section>

        <section data-tour="settings-notifications" className={sectionCls}>
          <div className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <h3 className="text-[15px] font-semibold text-[var(--color-cs-text)]">
              Push on this device
            </h3>
            <p className="mb-3 mt-1 text-[12.5px] text-[var(--color-cs-text-secondary)]">
              Get alerts the moment a threshold changes — in addition to email.
            </p>
            <PushToggle />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            Managing
          </h2>
          <div className="cs-ios-list">
            {(
              [
                { href: "/beneficiaries", label: "Beneficiaries" },
                { href: "/transactions", label: "Linked banks" },
                { href: "/reports", label: "Data & exports" },
                { href: "/how-it-works", label: "Help & how it works" },
              ] as const
            ).map((item) => (
              <Link key={item.href} href={item.href} className="cs-ios-row">
                <span className="flex-1 text-[16px] font-medium">{item.label}</span>
                <span className="text-[16px] text-[var(--color-cs-text-muted)]" aria-hidden>
                  ›
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 pb-4">
          <SignOutButton />
          <div className="flex justify-center">
            <DeleteAccountButton />
          </div>
          <p className="pt-1 text-center text-[12px] text-[var(--color-cs-text-muted)]">
            MyBenefitsPA 1.0
          </p>
        </section>
      </div>
    </div>
  );
}
