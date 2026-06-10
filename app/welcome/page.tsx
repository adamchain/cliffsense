import Link from "next/link";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand/brand-mark";

export default async function WelcomePage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      <header className="flex h-12 items-center justify-between border-b border-[var(--color-cs-border)] bg-[var(--color-cs-brand)] px-4 text-white">
        <Link href="/auth/signin" className="flex items-center gap-2 text-sm font-medium">
          <BrandMark size="sm" />
          CliffSense
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <Link href="/dashboard" className="rounded px-2 py-1 hover:bg-white/15">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="rounded px-2 py-1 hover:bg-white/15">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded bg-white/15 px-3 py-1 font-medium hover:bg-white/25"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-medium tracking-tight text-[var(--color-cs-text)]">
          Stay under the limits that keep your benefits.
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          CliffSense connects to your bank through Plaid, shows how deposits and balances compare to
          common program thresholds, and emails you before you approach a limit — so you can plan with
          your counselor or trustee.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {!session && (
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
            >
              Get started
            </Link>
          )}
          <Link
            href="/resources"
            className="inline-flex items-center rounded-sm border border-[var(--color-cs-input-border)] bg-white px-5 py-2 text-sm text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
          >
            Resources
          </Link>
        </div>
        <p className="mt-12 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
          Informational tool only. Not legal, tax, or benefits advice. Thresholds change; always
          confirm with SSA, your state agency, or a qualified benefits counselor.
        </p>
      </main>
    </div>
  );
}
