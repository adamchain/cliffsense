"use client";

import Link from "next/link";
import { IconBuildingBank } from "@tabler/icons-react";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import { PlaidConnectModal } from "@/components/plaid/plaid-connect-modal";
import { AccountConnectionActions } from "@/components/transactions/connection-actions";

export type AccountConnection = {
  id: string;
  institutionName: string;
  status: string;
  lastSyncAt: string | null;
  accounts: { name: string; mask: string; currentBalanceCents: number }[];
};

/**
 * The connected-accounts manager, baked into the Banking page so accounts no
 * longer live on a page of their own. Data is loaded by the server page and
 * passed in; the per-connection actions refresh that server data in place.
 */
export function AccountsPanel({
  beneficiaryId,
  connections,
}: {
  beneficiaryId: string | null;
  connections: AccountConnection[];
}) {
  return (
    <section className="mb-4 rounded-2xl border border-[var(--color-cs-border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[var(--color-cs-text)]">
            <IconBuildingBank size={18} stroke={1.8} aria-hidden />
            Connected accounts
          </h2>
          <p className="mt-1 max-w-xl text-[12px] text-[var(--color-cs-text-secondary)]">
            Banks linked through Plaid. Add another or disconnect anytime — we keep read-only access only.
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
        <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
          Add a beneficiary profile first to link a bank.{" "}
          <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
            Continue onboarding
          </Link>
          .
        </p>
      )}

      {beneficiaryId && connections.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          No bank connections yet. Use <strong>Connect a bank</strong> above to get started.
        </div>
      )}

      {connections.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {connections.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-4 text-[13px]"
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
                    <span className="min-w-0 truncate text-[var(--color-cs-text-secondary)]">
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
      )}
    </section>
  );
}
