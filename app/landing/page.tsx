import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { HeroVideo } from "@/components/landing/hero-video";
import { InlineLoginForm } from "@/components/auth/inline-login-form";

export const metadata: Metadata = {
  title: "MyBenefitsPA — Pennsylvania's Benefits Continuity and Renewal Compliance Platform",
  description:
    "MyBenefitsPA helps individuals, families, and caregivers organize the documents, deadlines, income, assets, work activity, and reporting requirements needed to maintain Medicaid and other public benefits. It works alongside Pennsylvania's existing eligibility systems to improve renewal compliance and prevent avoidable coverage loss.",
};

/* ----------------------------------------------------------------------------
 * Landing page — temporarily reduced to just the hero with an inline sign-in
 * form. The full marketing surface (modules, features, vault, about, footer)
 * is hidden for now; restore from git history when it's ready to relaunch.
 * ------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-[rgba(248,248,250,0.82)] backdrop-blur-[22px] backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
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
        </div>
      </header>

      {/* ---------- Hero (video background, copy left, sign-in right) ---------- */}
      <section className="relative overflow-hidden">
        <HeroVideo />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <p className="cs-eyebrow text-[var(--color-cs-brand)]">
                Pennsylvania&apos;s Benefits Continuity &amp; Renewal Compliance Platform
              </p>
              <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-0.6px] text-[var(--color-cs-text)] sm:text-[56px] md:text-[64px]">
                Keep Benefits in Place.<br />Stay Ready for Every Renewal.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[var(--color-cs-text-secondary)] sm:text-lg">
                MyBenefitsPA helps individuals, families, and caregivers organize the documents,
                deadlines, income, assets, work activity, and reporting requirements needed to maintain
                Medicaid and other public benefits — working alongside Pennsylvania&apos;s existing
                eligibility systems to improve renewal compliance and prevent avoidable coverage loss.
              </p>
            </div>

            <div className="w-full max-w-[400px] justify-self-center lg:justify-self-end">
              <InlineLoginForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
