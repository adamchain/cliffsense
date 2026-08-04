"use client";

import { useWalkthroughOptional } from "./walkthrough-provider";

/** Restart the interactive product tour (used on Help → Quick start). */
export function StartWalkthroughButton({ className }: { className?: string }) {
  const walkthrough = useWalkthroughOptional();
  if (!walkthrough) return null;

  return (
    <button
      type="button"
      onClick={() => walkthrough.start()}
      className={
        className ??
        "inline-flex items-center rounded-full bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
      }
    >
      Start walkthrough
    </button>
  );
}
