import Image from "next/image";
import Link from "next/link";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
] as const;

export function MarketingHeader({
  continueHref,
}: {
  /** When set, show Continue instead of Sign in. */
  continueHref?: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-[rgba(248,248,250,0.82)] backdrop-blur-[22px] backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="MyBenefitsPA home">
          <Image
            src="/mybenefitspa-logo.png"
            alt="MyBenefitsPA"
            width={180}
            height={142}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-[var(--color-cs-text-secondary)] md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--color-cs-text)]">
              {item.label}
            </Link>
          ))}
        </nav>
        {continueHref ? (
          <Link
            href={continueHref}
            className="text-[13px] font-semibold text-[var(--color-cs-brand)] hover:text-[var(--color-cs-brand-hover)]"
          >
            Continue
          </Link>
        ) : (
          <Link
            href="/#sign-in"
            className="text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

const FOOTER_GROUPS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Evidence vault", href: "/#tools" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "A father's perspective", href: "/about#perspective" },
      { label: "Sign in", href: "/#sign-in" },
      { label: "Support", href: "mailto:support@mybenefitspa.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Security", href: "/legal/security" },
      { label: "Data retention", href: "/legal/data-retention" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--color-cs-surface)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              A Pennsylvania-first, user-controlled benefits continuity and renewal compliance
              platform.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((g) => (
              <div key={g.heading}>
                <p className="text-[13px] font-semibold text-[var(--color-cs-text)]">{g.heading}</p>
                <ul className="mt-3 space-y-2">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--color-cs-border)] pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[var(--color-cs-text-muted)]">
              © {new Date().getFullYear()} MyBenefitsPA. All rights reserved.
            </p>
            <p className="text-[12px] text-[var(--color-cs-text-muted)]">
              Not a government agency — does not determine eligibility.
            </p>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
            MyBenefitsPA does not determine or guarantee eligibility, benefit amounts, continued
            coverage, or the outcome of any agency proceeding. It does not replace official agency
            instructions or individualized legal, tax, financial, medical, or benefits advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
