import { getAdminOverview } from "@/lib/admin/metrics";
import { StatCard } from "./_components/stat-card";
import { SignupSparkline } from "./_components/signup-sparkline";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview(new Date());
  const { users, data, attention } = overview;

  return (
    <>
      <h1 className="mb-1 text-xl font-medium text-[var(--color-cs-text)]">Overview</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Live platform health. Figures are computed on each load — no caching — so
        this reflects the database right now.
      </p>

      {/* Attention first: anything an operator would act on. */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Open alerts"
          value={attention.openAlerts}
          tone={attention.openAlerts > 0 ? "warning" : "default"}
          href="/admin/activity"
        />
        <StatCard
          label="Active breaches"
          value={attention.breaches}
          tone={attention.breaches > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Bank errors"
          value={data.bankErrors}
          tone={data.bankErrors > 0 ? "danger" : "success"}
          hint="Login required / error"
          href="/admin/banks"
        />
        <StatCard
          label="Stale syncs"
          value={attention.staleConnections}
          tone={attention.staleConnections > 0 ? "warning" : "default"}
          hint="Active, no sync in 3d"
          href="/admin/banks"
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <SignupSparkline data={overview.signupsByDay} />
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total users" value={users.total} href="/admin/users" />
          <StatCard label="New · 7d" value={users.newLast7} hint={`${users.newLast30} in 30d`} />
          <StatCard label="Active · 30d" value={users.activeLast30} hint="Signed in" />
          <StatCard
            label="Onboarded"
            value={users.total ? `${Math.round((users.onboardingComplete / users.total) * 100)}%` : "—"}
            hint={`${users.onboardingComplete} complete`}
          />
        </div>
      </div>

      <h2 className="mb-2 text-[13px] font-bold text-[var(--color-cs-text)]">Roster</h2>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Admins" value={users.admins} tone="info" href="/admin/users?role=admin" />
        <StatCard
          label="Disabled"
          value={users.disabled}
          tone={users.disabled > 0 ? "danger" : "default"}
          href="/admin/users?status=disabled"
        />
        <StatCard label="Pending invites" value={attention.pendingInvites} href="/admin/invites" />
        <StatCard label="Beneficiaries" value={data.beneficiaries} />
      </div>

      <h2 className="mb-2 text-[13px] font-bold text-[var(--color-cs-text)]">Data</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Bank connections" value={data.bankConnections} href="/admin/banks" />
        <StatCard label="Transactions" value={data.transactions.toLocaleString()} hint="Estimated" />
        <StatCard label="Beneficiaries" value={data.beneficiaries} />
        <StatCard label="Open alerts" value={attention.openAlerts} />
      </div>
    </>
  );
}
