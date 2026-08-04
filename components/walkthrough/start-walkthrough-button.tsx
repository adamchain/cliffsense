"use client";

import { IconRocket } from "@tabler/icons-react";
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
        "cs-btn cs-btn-primary inline-flex items-center gap-2 !px-5 !py-2.5 !text-[14px]"
      }
    >
      <IconRocket size={18} stroke={1.8} aria-hidden />
      Start interactive walkthrough
    </button>
  );
}
