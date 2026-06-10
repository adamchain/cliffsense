import Link from "next/link";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand/brand-mark";
import { InlineLoginForm } from "@/components/auth/inline-login-form";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center bg-[var(--color-cs-surface)] px-6 py-12 text-[var(--color-cs-text)]">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        {/* Left: brand + value proposition */}
        <section>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-cs-brand)]">
            <BrandMark size="sm" />
            CliffSense
          </Link>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--color-cs-text)] sm:text-4xl">
            Stay under the limits that keep your benefits.
          </h1>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            CliffSense connects to your bank through Plaid, shows how deposits and balances compare to common program
            thresholds, and emails you before you approach a limit — so you can plan with your counselor or trustee.
          </p>

          <div className="mt-6">
            <Link
              href="/resources"
              className="inline-flex items-center rounded-sm border border-[var(--color-cs-input-border)] bg-white px-5 py-2 text-sm font-medium text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
            >
              Resources
            </Link>
          </div>

          <p className="mt-10 max-w-xl text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
            Informational tool only. Not legal, tax, or benefits advice. Thresholds change; always confirm with SSA,
            your state agency, or a qualified benefits counselor.
          </p>
        </section>

        {/* Right: login (or dashboard hand-off when already signed in) */}
        <section className="w-full max-w-[400px] justify-self-center md:justify-self-end">
          {session ? (
            <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-[var(--color-cs-text)]">You&apos;re signed in</h2>
              <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
                Welcome back. Continue to your dashboard to check threshold status and alerts.
              </p>
              <Link
                href="/dashboard"
                className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
              >
                Go to dashboard
              </Link>
            </div>
          ) : (
            <InlineLoginForm />
          )}
        </section>
      </div>
    </main>
  );
}
