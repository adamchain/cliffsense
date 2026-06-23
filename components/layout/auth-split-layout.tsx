import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export function AuthSplitLayout({
  children,
  sideTitle,
  sideBody,
  sideFooter,
}: {
  children: ReactNode;
  sideTitle: string;
  sideBody: ReactNode;
  sideFooter?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[var(--color-cs-text)] lg:flex-row">
      <aside className="relative flex w-full shrink-0 flex-col justify-between overflow-hidden border-b border-white/10 bg-gradient-to-b from-[var(--color-cs-brand)] to-[var(--color-cs-navy)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:w-[420px] lg:border-b-0 lg:border-r lg:px-11 lg:py-12">
        {/* decorative accent circles, echoing the marketing landing page */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-white/[0.06]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-[var(--color-cs-accent-orange)]/20"
        />
        <div className="relative z-[1]">
          <Link
            href="/auth/signin"
            className="mb-6 inline-flex items-center gap-3.5 text-[17px] font-semibold tracking-tight text-white hover:text-white/95 lg:mb-10"
          >
            <BrandMark size="xl" onDark />
            MyBenefitsPA
          </Link>
          <h2 className="text-[22px] font-semibold leading-snug tracking-tight text-white sm:text-[26px]">{sideTitle}</h2>
          <div className="mt-3 text-[13px] leading-[1.55] text-white/88 sm:mt-4">{sideBody}</div>
        </div>
        {sideFooter ? (
          <div className="relative z-[1] mt-6 border-t border-white/15 pt-5 text-[11px] leading-relaxed text-white/72 lg:mt-10 lg:pt-6">
            {sideFooter}
          </div>
        ) : null}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-6 py-10 sm:border-t-0 sm:border-l sm:px-10 sm:py-14 lg:min-h-screen">
        {children}
      </div>
    </div>
  );
}
