import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import { PlaidConnectModal } from "@/components/plaid/plaid-connect-modal";
import { AccountConnectionActions } from "./connection-actions";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  let connections: {
    id: string;
    institutionName: string;
    status: string;
    lastSyncAt: string | null;
    accounts: { name: string; mask: string; currentBalanceCents: number }[];
  }[] = [];

  if (beneficiaryId) {
    await connectDB();
    const raw = await BankConnection.find({ beneficiaryId })
      .select("institutionName status accounts lastSyncAt")
      .sort({ updatedAt: -1 })
      .lean();
    connections = raw.map((c) => ({
      id: c._id.toString(),
      institutionName: c.institutionName || "Bank",
      status: c.status,
      lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
      accounts: (c.accounts ?? []).map((a) => ({
        name: a.name,
        mask: a.mask,
        currentBalanceCents: a.currentBalanceCents,
      })),
    }));
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Accounts</div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Connected accounts</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
            Banks linked through Plaid. Add another or disconnect anytime — we keep read-only
            access only.
          </p>
        </div>
        {beneficiaryId && (
          <PlaidConnectModal
            primaryBeneficiaryId={beneficiaryId}
            variant="primary"
            label={connections.length > 0 ? "Add another bank" : "Connect a bank"}
          />
        )}
      </div>

      {!beneficiaryId && (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          Add a beneficiary profile first to link a bank.{" "}
          <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
            Continue onboarding
          </Link>
          .
        </p>
      )}

      {beneficiaryId && connections.length === 0 && (
        <div className="rounded border border-dashed border-[var(--color-cs-border)] bg-white p-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          No bank connections yet. Use <strong>Connect a bank</strong> above to get started.
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {connections.map((c) => (
          <li
            key={c.id}
            className="rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-[var(--color-cs-text)]">{c.institutionName}</span>
              <span className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">
                {c.status}
                {c.lastSyncAt && (
                  <>
                    {" · synced "}
                    {new Date(c.lastSyncAt).toLocaleString()}
                  </>
                )}
              </span>
            </div>
            <ul className="mt-2 space-y-2 border-t border-[var(--color-cs-border)] pt-2">
              {c.accounts.map((a) => (
                <li key={a.mask + a.name} className="flex justify-between gap-3">
                  <span className="text-[var(--color-cs-text-secondary)]">
                    {a.name}
                    {a.mask ? <span className="text-[var(--color-cs-text-muted)]"> ·••• {a.mask}</span> : null}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-[var(--color-cs-text)]">
                    {formatPlainUsdFromCents(a.currentBalanceCents)}
                  </span>
                </li>
              ))}
            </ul>
            {beneficiaryId && (
              <AccountConnectionActions
                connectionId={c.id}
                beneficiaryId={beneficiaryId}
                institutionName={c.institutionName}
                needsReauth={c.status === "login_required"}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
