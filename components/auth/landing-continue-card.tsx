import Link from "next/link";

function firstName(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

export function LandingContinueCard({
  name,
  href,
  ctaLabel,
}: {
  name?: string | null;
  href: string;
  ctaLabel: string;
}) {
  const first = firstName(name);

  return (
    <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-[var(--color-cs-text)]">
        {first ? `Welcome back, ${first}` : "Welcome back"}
      </h2>
      <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
        You&apos;re already signed in. Continue to your account, or stay here and browse the site.
      </p>
      <Link
        href={href}
        className="mt-5 flex w-full items-center justify-center rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
      >
        {ctaLabel}
      </Link>
      <p className="mt-3 text-center text-xs text-[var(--color-cs-text-secondary)]">
        Or keep scrolling to learn more about MyBenefitsPA.
      </p>
    </div>
  );
}
