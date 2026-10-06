import Link from "next/link";
import { HeroVideo } from "@/components/landing/hero-video";
import { StayUpdatedForm } from "@/components/auth/stay-updated-form";
import { BrandStackedMark } from "@/components/brand/brand-logo";
import {
  BRAND_LINE,
  FOOTER_LIMITS,
  HERO_BODY,
  HERO_DESCRIPTOR,
  HERO_HEADLINE,
  HERO_TAGLINE,
  SITE_DISCLAIMER,
} from "@/components/landing/claims";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-cs-navy)]">
      <HeroVideo />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
              <BrandStackedMark priority className="h-16 w-auto sm:h-[4.5rem]" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                Coming soon
              </span>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9ecbff]">
                {HERO_TAGLINE}
              </p>
            </div>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.6px] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] sm:text-[46px] md:text-[54px]">
              {HERO_HEADLINE}
            </h1>
            <p className="mt-3 text-[13px] font-semibold leading-snug text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
              {HERO_DESCRIPTOR}
            </p>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] sm:text-lg">
              {HERO_BODY}
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex text-[14px] font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              About Bene-Watch
            </Link>
          </div>

          <div className="w-full max-w-[400px] justify-self-center lg:justify-self-end">
            <StayUpdatedForm />
          </div>
        </div>
      </div>
      <footer className="relative border-t border-white/15 px-5 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-3 text-[12px] leading-relaxed text-white/70">
          <p>
            {BRAND_LINE} · Bene-Watch.com. {FOOTER_LIMITS}
          </p>
          <p>{SITE_DISCLAIMER}</p>
        </div>
      </footer>
    </main>
  );
}
