"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconMenu2, IconSettings, IconX } from "@tabler/icons-react";
import type { NavItem } from "./mobile-tab-bar";

/**
 * Hamburger button (topbar, mobile only) that slides in a left drawer with the
 * full navigation — the same destinations as the desktop sidebar, reachable
 * from the top of any page.
 */
export function MobileNavDrawer({
  nav,
  activeHref,
  alertCount = 0,
}: {
  nav: NavItem[];
  activeHref: string;
  alertCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const badge = alertCount > 9 ? "9+" : String(alertCount);
  const isActive = (href: string) => activeHref === href || activeHref.startsWith(href + "/");

  // Portals need a client mount; also lock body scroll while the drawer is open.
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Rendered to <body> so the topbar's backdrop-blur (which would otherwise
  // trap a fixed child inside the header) can't clip or hide the drawer.
  const drawer = (
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[var(--color-cs-navy)]/40" onClick={() => setOpen(false)} />
          <div className="cs-safe-bottom absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-white shadow-[var(--shadow-cs-float)]">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[17px] font-extrabold tracking-tight text-[var(--color-cs-text)]">
                MyBenefitsPA
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-text-secondary)]"
              >
                <IconX size={18} stroke={1.8} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6" aria-label="Main">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                const showCount = href === "/alerts" && alertCount > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors ${
                      active
                        ? "bg-[var(--color-cs-brand)] text-white"
                        : "text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
                    }`}
                  >
                    <Icon size={20} stroke={active ? 2 : 1.7} aria-hidden />
                    {label}
                    {showCount && (
                      <span
                        className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none ${
                          active ? "bg-white/25 text-white" : "bg-[var(--color-cs-danger)] text-white"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={`mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors ${
                  isActive("/settings")
                    ? "bg-[var(--color-cs-brand)] text-white"
                    : "text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
                }`}
              >
                <IconSettings size={20} stroke={1.7} aria-hidden />
                Settings
              </Link>
            </nav>
          </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)] lg:hidden"
      >
        <IconMenu2 size={22} stroke={1.8} aria-hidden />
      </button>

      {open && mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
