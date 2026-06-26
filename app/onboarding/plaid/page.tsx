import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { getOrCreateOwnerBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { isPlaidLinkConfigured, isPlaidExchangeConfigured } from "@/lib/plaid/server";
import { PlaidOnboardingActions } from "./plaid-actions";

export default async function OnboardingPlaidPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getOrCreateOwnerBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  const linkReady = isPlaidLinkConfigured();
  const exchangeReady = isPlaidExchangeConfigured();

  const subtitle = (
    <>
      We use Plaid to detect recurring deposits and balances that may count toward benefit limits.
      {!linkReady && (
        <>
          {" "}
          Set <code className="rounded bg-[var(--color-cs-nav-hover)] px-1">PLAID_CLIENT_ID</code> and{" "}
          <code className="rounded bg-[var(--color-cs-nav-hover)] px-1">PLAID_SECRET</code> to open Link. For saving
          the connection, also set{" "}
          <code className="rounded bg-[var(--color-cs-nav-hover)] px-1">PLAID_ENCRYPTION_KEY</code> (32-byte key,
          base64).
        </>
      )}
      {linkReady && !exchangeReady && (
        <>
          {" "}
          Add <code className="rounded bg-[var(--color-cs-nav-hover)] px-1">PLAID_ENCRYPTION_KEY</code> so we can store
          tokens encrypted at rest.
        </>
      )}
    </>
  );

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="plaid"
      eyebrow="Plaid"
      title="Connect a bank account"
      subtitle={subtitle}
    >
      <div className="cs-card p-6 md:p-7">
        <div className="mb-5 flex items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-cs-border)] bg-white">
            <BrandMark size="lg" />
          </div>
          <span className="select-none text-lg tracking-widest text-[var(--color-cs-text-muted)]" aria-hidden>
            ···
          </span>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-xs font-semibold tracking-tight text-[var(--color-cs-text)]"
            aria-label="Plaid"
          >
            Plaid
          </div>
        </div>
        <p className="text-center text-sm font-semibold text-[var(--color-cs-text)]">Secure read-only access</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-cs-success)]/30 bg-[var(--color-cs-success-bg)] p-4">
            <p className="text-xs font-semibold text-[var(--color-cs-success)]">We can see</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-[var(--color-cs-text-secondary)]">
              <li>Balances and transactions</li>
              <li>Account names and masks</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--color-cs-danger)]/30 bg-[var(--color-cs-danger-bg)] p-4">
            <p className="text-xs font-semibold text-[var(--color-cs-danger)]">We never see</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-[var(--color-cs-text-secondary)]">
              <li>Your bank username or password</li>
              <li>Ability to move funds</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-center text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          We only link accounts to a beneficiary profile so alerts and limits stay in the right place.
        </p>
        <PlaidOnboardingActions beneficiaryId={beneficiaryId} />
      </div>
      <p className="mt-4 text-center text-[11px] text-[var(--color-cs-text-muted)]">
        <Link
          className="hover:underline"
          href="https://plaid.com/legal/#end-user-privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          Plaid privacy policy
        </Link>
      </p>
    </OnboardingShell>
  );
}
