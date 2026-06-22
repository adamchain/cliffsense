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

  const aside = (
    <aside className="hidden w-[280px] shrink-0 flex-col justify-between bg-[var(--color-cs-brand)] p-7 text-white lg:flex">
      <div>
        <Link href="/" className="mb-8 flex items-center gap-2.5 text-base font-medium">
          <BrandMark size="md" onDark />
          MyBenefitsPA
        </Link>
        <h2 className="text-[22px] font-medium leading-snug">Connect your bank</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-white/85">
          Plaid lets MyBenefitsPA read balances and transactions — not move money. You can disconnect anytime.
        </p>
      </div>
      <p className="text-[11px] text-white/70">
        <Link className="underline" href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noreferrer">
          Plaid privacy policy
        </Link>
      </p>
    </aside>
  );

  return (
    <OnboardingShell accountType={session.user.accountType} currentStepId="plaid" aside={aside}>
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Onboarding · <strong className="text-[var(--color-cs-brand)]">Plaid</strong>
      </p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--color-cs-text)]">Connect a bank account</h1>
      <p className="mt-2 max-w-[540px] text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
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
      </p>

      <div className="mt-6 max-w-xl rounded border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--color-cs-border)] bg-white">
            <BrandMark size="lg" />
          </div>
          <span className="select-none text-lg tracking-widest text-[var(--color-cs-text-muted)]" aria-hidden>
            ···
          </span>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--color-cs-border)] bg-[#f3f2f1] text-xs font-semibold tracking-tight text-[#111]"
            aria-label="Plaid"
          >
            Plaid
          </div>
        </div>
        <p className="text-center text-sm font-medium text-[var(--color-cs-text)]">Secure read-only access</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded border border-[#c7e0c7] bg-[var(--color-cs-success-bg)] p-3.5">
            <p className="text-xs font-medium text-[#0e5e0e]">We can see</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-[#143b14]">
              <li>Balances and transactions</li>
              <li>Account names and masks</li>
            </ul>
          </div>
          <div className="rounded border border-[#f0c4c7] bg-[var(--color-cs-danger-bg)] p-3.5">
            <p className="text-xs font-medium text-[#8e2024]">We never see</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-[#4a1417]">
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
    </OnboardingShell>
  );
}
