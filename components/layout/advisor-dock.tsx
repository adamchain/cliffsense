"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IconArrowsMaximize, IconArrowsMinimize, IconMessageCircle, IconX } from "@tabler/icons-react";
import { AdvisorWorkspace } from "@/app/(authenticated)/advisor/advisor-workspace";

/**
 * Floating advisor button (same corner the feedback button used to occupy).
 * Opens a right-hand chat panel that can grow to fill the screen.
 */
export function AdvisorDock({ beneficiaryId }: { beneficiaryId: string | null }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const onAdvisorPage = pathname === "/advisor" || pathname.startsWith("/advisor/");

  if (onAdvisorPage) return null;

  function close() {
    setOpen(false);
    setExpanded(false);
  }

  return (
    <>
      {open && (
        <div
          className={`fixed z-[70] flex flex-col bg-[var(--color-cs-surface)] shadow-[var(--shadow-cs-float)] ${
            expanded
              ? "inset-0"
              : "inset-y-0 right-0 w-full max-w-[440px] border-l border-[var(--color-cs-border)]"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Advisor"
        >
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-cs-border)] px-4">
            <h2 className="text-[15px] font-semibold text-[var(--color-cs-text)]">Advisor</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
                aria-label={expanded ? "Exit full screen" : "Expand full screen"}
              >
                {expanded ? (
                  <IconArrowsMinimize size={16} stroke={1.8} aria-hidden />
                ) : (
                  <IconArrowsMaximize size={16} stroke={1.8} aria-hidden />
                )}
                <span>{expanded ? "Exit full screen" : "Full screen"}</span>
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Close advisor"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
              >
                <IconX size={18} stroke={1.8} aria-hidden />
              </button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <AdvisorWorkspace beneficiaryId={beneficiaryId} layout="panel" />
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open advisor"
          className="fixed bottom-24 right-4 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-white shadow-[var(--shadow-cs-float)] hover:bg-[var(--color-cs-brand-hover)] lg:bottom-6 lg:right-6"
        >
          <IconMessageCircle size={26} stroke={1.8} aria-hidden />
        </button>
      )}
    </>
  );
}
