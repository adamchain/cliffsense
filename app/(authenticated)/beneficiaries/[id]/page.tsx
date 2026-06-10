import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import Threshold from "@/lib/db/models/Threshold";
import Alert from "@/lib/db/models/Alert";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import { PlaidConnectModal } from "@/components/plaid/plaid-connect-modal";
import { getBeneficiaryAccessRole } from "@/lib/beneficiaries/access";
import { SharingPanel } from "@/components/beneficiaries/sharing-panel";

export default async function BeneficiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const { id } = await params;

  await connectDB();
  const role = await getBeneficiaryAccessRole(session.user.id, id);
  if (!role) notFound();
  const canManageSharing = role === "owner" || role === "co_manager";
  const ben = await Beneficiary.findById(id).lean();
  if (!ben) notFound();

  const [connections, thresholds, recentAlerts] = await Promise.all([
    BankConnection.find({ beneficiaryId: ben._id })
      .select("institutionName status accounts lastSyncAt")
      .sort({ updatedAt: -1 })
      .lean(),
    Threshold.find({ beneficiaryId: ben._id, scope: "user" })
      .select("label program limitCents comparison")
      .lean(),
    Alert.find({ beneficiaryId: ben._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("level trigger message createdAt status")
      .lean(),
  ]);

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        Home › <Link href="/beneficiaries" className="hover:underline">Beneficiaries</Link> ›{" "}
        {ben.firstName} {ben.lastName}
      </div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-cs-text)]">
            {ben.firstName} {ben.lastName}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
            {ben.isOwner ? "Primary beneficiary · " : ""}
            {ben.state || "No state"} · Household {ben.householdSize}
          </p>
        </div>
        <PlaidConnectModal
          primaryBeneficiaryId={ben._id.toString()}
          variant="primary"
          label="Connect a bank"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Enrolled programs</h2>
          {(ben.benefitsEnrolled ?? []).length === 0 ? (
            <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
              No programs yet.{" "}
              <Link href="/onboarding/benefits" className="text-[var(--color-cs-brand)] hover:underline">
                Pick programs
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1.5 text-[13px]">
              {ben.benefitsEnrolled.map((e) => (
                <li key={e.program} className="flex justify-between gap-2">
                  <span className="font-medium text-[var(--color-cs-text)]">{e.program}</span>
                  <span className="text-[11px] text-[var(--color-cs-text-secondary)]">
                    {e.enrolledSince
                      ? `Since ${new Date(e.enrolledSince).toLocaleDateString()}`
                      : "Date unknown"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Active limits</h2>
          {thresholds.length === 0 ? (
            <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
              No limits.{" "}
              <Link href="/thresholds" className="text-[var(--color-cs-brand)] hover:underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1.5 text-[13px]">
              {thresholds.map((t) => (
                <li key={t._id.toString()} className="flex justify-between gap-2">
                  <span className="text-[var(--color-cs-text)]">{t.label}</span>
                  <span className="text-[11px] uppercase text-[var(--color-cs-text-secondary)]">
                    {t.program ?? "—"} · {t.comparison} {formatPlainUsdFromCents(t.limitCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2 rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Linked banks</h2>
          {connections.length === 0 ? (
            <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
              No banks linked yet.
            </p>
          ) : (
            <ul className="space-y-3 text-[13px]">
              {connections.map((c) => (
                <li
                  key={c._id.toString()}
                  className="rounded border border-[var(--color-cs-border)] p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{c.institutionName || "Bank"}</span>
                    <span className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">
                      {c.status}
                      {c.lastSyncAt && ` · synced ${new Date(c.lastSyncAt).toLocaleString()}`}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 border-t border-[var(--color-cs-border)] pt-2">
                    {(c.accounts ?? []).map((a, i) => (
                      <li key={i} className="flex justify-between text-[12px]">
                        <span className="text-[var(--color-cs-text-secondary)]">
                          {a.name}
                          {a.mask ? ` ·••• ${a.mask}` : ""}
                        </span>
                        <span className="tabular-nums">
                          {formatPlainUsdFromCents(a.currentBalanceCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2 rounded border border-[var(--color-cs-border)] bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--color-cs-text)]">Recent alerts</h2>
            <Link
              href="/alerts"
              className="text-[11px] text-[var(--color-cs-brand)] hover:underline"
            >
              View all
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
              No alerts for this beneficiary.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-cs-border)] text-[13px]">
              {recentAlerts.map((a) => (
                <li key={a._id.toString()} className="py-2">
                  <div className="text-[11px] uppercase text-[var(--color-cs-text-secondary)]">
                    {a.level} · {a.trigger} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                  <p className="text-[var(--color-cs-text)]">{a.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManageSharing && (
          <section className="md:col-span-2 rounded border border-[var(--color-cs-border)] bg-white p-4">
            <h2 className="mb-1 text-sm font-medium text-[var(--color-cs-text)]">Sharing &amp; access</h2>
            <p className="mb-3 text-[12px] text-[var(--color-cs-text-secondary)]">
              Invite family, a co-manager, or an agency caseworker. Viewers are read-only; co-managers can edit. The
              beneficiary can also be invited to see what you see.
            </p>
            <SharingPanel beneficiaryId={ben._id.toString()} />
          </section>
        )}
      </div>
    </>
  );
}
