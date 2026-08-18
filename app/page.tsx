import Image from "next/image";
import Link from "next/link";
import { HeroVideo } from "@/components/landing/hero-video";
import { StayUpdatedForm } from "@/components/auth/stay-updated-form";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-cs-navy)]">
      <HeroVideo />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-2xl">
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              priority
              className="h-12 w-auto brightness-0 invert"
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                Coming soon
              </span>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9ecbff]">
                A Pennsylvania-first benefits continuity &amp; renewal compliance platform
              </p>
            </div>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.6px] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] sm:text-[46px] md:text-[54px]">
              Act Before an Avoidable Lapse Becomes a Loss of Care
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] sm:text-lg">
              MyBenefitsPA gives beneficiaries and authorized caregivers an active system for
              recognizing approaching benefit risks, organizing required evidence, tracking
              critical deadlines, and maintaining a clear record of what has been submitted.
            </p>
          </div>

          <div className="w-full max-w-[400px] justify-self-center lg:justify-self-end">
            <StayUpdatedForm />
          </div>
        </div>
      </div>
      <footer className="relative pb-6 text-center">
        <Link
          href="/auth/signin"
          className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
        >
          Sign in
        </Link>
      </footer>
    </main>
  );
}
