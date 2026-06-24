import Image from "next/image";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms and Conditions" },
  { href: "/legal/security", label: "Security and Safeguards" },
  { href: "/legal/data-retention", label: "Data Retention and Deletion" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/landing" className="flex items-center" aria-label="MyBenefitsPA home">
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-cs-brand)] hover:underline"
          >
            <IconArrowLeft size={16} stroke={2.2} /> Back to home
          </Link>
        </div>
      </header>

      {/* ---------- Document body ---------- */}
      <main className="mx-auto max-w-4xl px-6 py-12">{children}</main>

      {/* ---------- Footer (cross-links to all policies) ---------- */}
      <footer className="border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)]">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm font-semibold text-[var(--color-cs-text)]">Compliance documents</p>
          <nav className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-[12px] leading-relaxed text-[var(--color-cs-text-muted)]">
            © {new Date().getFullYear()} MyBenefitsPA Inc. Informational tool only. Not legal, tax, or
            benefits advice. Questions: privacy@mybenefitspa.com · security@mybenefitspa.com ·
            support@mybenefitspa.com.
          </p>
        </div>
      </footer>
    </div>
  );
}
