import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import Alert from "@/lib/db/models/Alert";
import AdminAuditLog, { type AdminAuditAction } from "@/lib/db/models/AdminAuditLog";
import { ADMIN_AUDIT_LABEL } from "@/lib/admin/audit-labels";
import { UserAdminActions } from "./user-actions";

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--color-cs-surface)] px-3 py-2.5">
      <div className="text-[11px] text-[var(--color-cs-text-secondary)]">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-[var(--color-cs-text)]">{value}</div>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();

  const { id } = await params;
  await connectDB();
  const user = await User.findById(id)
    .select("email name accountType isAdmin status onboardingStep createdAt lastLoginAt emailVerified")
    .lean();
  if (!user) notFound();

  const beneficiaries = await Beneficiary.find({ ownerUserId: id })
    .select("firstName lastName isOwner state county")
    .lean();
  const benIds = beneficiaries.map((b) => b._id);

  const [bankCount, alertCount, audit] = await Promise.all([
    benIds.length ? BankConnection.countDocuments({ beneficiaryId: { $in: benIds } }) : 0,
    benIds.length
      ? Alert.countDocuments({ beneficiaryId: { $in: benIds }, status: { $in: ["new", "acknowledged"] } })
      : 0,
    AdminAuditLog.find({ targetUserId: id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const status = (user.status as "active" | "disabled") ?? "active";
  const isSelf = user._id.toString() === session.user.id;

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>{" "}
        ›{" "}
        <Link href="/admin/users" className="hover:underline">
          Users
        </Link>{" "}
        › {user.email}
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-[var(--color-cs-text)]">
            {user.name || user.email}
            {user.isAdmin && (
              <span className="rounded bg-[var(--color-cs-info-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-cs-info)]">
                Admin
              </span>
            )}
            {status === "disabled" && (
              <span className="rounded bg-[var(--color-cs-danger-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-cs-danger)]">
                Disabled
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-cs-text-secondary)]">{user.email}</p>
        </div>
      </div>

      <section className="cs-card mb-4 p-4 sm:p-5">
        <h2 className="mb-2 text-[13px] font-bold text-[var(--color-cs-text)]">Manage</h2>
        <UserAdminActions
          userId={user._id.toString()}
          email={user.email}
          isAdmin={Boolean(user.isAdmin)}
          status={status}
          isSelf={isSelf}
        />
        {isSelf && (
          <p className="mt-2 text-[11px] text-[var(--color-cs-text-muted)]">
            This is your own account — self-disable and self-revoke are blocked.
          </p>
        )}
      </section>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Fact label="Account type" value={user.accountType} />
        <Fact label="Onboarding" value={user.onboardingStep} />
        <Fact label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
        <Fact label="Beneficiaries" value={beneficiaries.length} />
        <Fact label="Linked banks" value={bankCount} />
        <Fact label="Open alerts" value={alertCount} />
        <Fact
          label="Joined"
          value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
        />
        <Fact
          label="Last login"
          value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
        />
      </div>

      <section className="cs-card mb-4 p-4 sm:p-5">
        <h2 className="mb-2 text-[13px] font-bold text-[var(--color-cs-text)]">Beneficiaries</h2>
        {beneficiaries.length === 0 ? (
          <p className="text-[12px] text-[var(--color-cs-text-secondary)]">None.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-cs-border)] text-[13px]">
            {beneficiaries.map((b) => (
              <li key={b._id.toString()} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                <span className="font-medium text-[var(--color-cs-text)]">
                  {[b.firstName, b.lastName].filter(Boolean).join(" ") || "—"}
                  {b.isOwner && (
                    <span className="ml-2 rounded bg-[var(--color-cs-surface)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-text-secondary)]">
                      Owner
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                  {[b.county, b.state].filter(Boolean).join(", ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cs-card p-4 sm:p-5">
        <h2 className="mb-2 text-[13px] font-bold text-[var(--color-cs-text)]">Admin action history</h2>
        {audit.length === 0 ? (
          <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
            No admin actions recorded for this user.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-cs-border)] text-[12px]">
            {audit.map((a) => (
              <li key={a._id.toString()} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0">
                <span className="font-medium text-[var(--color-cs-text)]">
                  {ADMIN_AUDIT_LABEL[a.action as AdminAuditAction] ?? a.action}
                </span>
                <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                  {a.actorEmail || "admin"} · {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
