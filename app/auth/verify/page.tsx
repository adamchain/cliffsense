import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center font-sans">
      <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Check your email</h1>
      <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
        Email verification for magic links will appear here. For password sign-up you can continue to onboarding after
        signing in.
      </p>
      <Link href="/auth/signin" className="mt-6 inline-block text-sm text-[var(--color-cs-brand)] hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
