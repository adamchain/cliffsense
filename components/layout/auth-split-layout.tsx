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
    <div className="flex min-h-screen bg-[var(--color-cs-surface)] font-sans text-[var(--color-cs-text)]">
      <aside className="flex w-[280px] shrink-0 flex-col justify-between bg-[var(--color-cs-brand)] p-7 text-white">
        <div>
          <Link href="/" className="mb-8 flex items-center gap-2.5 text-base font-medium">
            <BrandMark size="md" />
            CliffSense
          </Link>
          <h2 className="text-[22px] font-medium leading-snug">{sideTitle}</h2>
          <div className="mt-3 text-[13px] leading-relaxed text-white/85">{sideBody}</div>
        </div>
        {sideFooter && (
          <div className="text-[11px] leading-relaxed text-white/70">{sideFooter}</div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col items-center px-8 py-12">{children}</div>
    </div>
  );
}
