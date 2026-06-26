"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useState } from "react";
import { IconDots, IconSettings, IconX } from "@tabler/icons-react";

type IconCmp = ComponentType<{ size?: number; stroke?: number; className?: string }>;
export type NavItem = { href: string; label: string; icon: IconCmp };

/**
 * Mobile bottom tab bar from the design samples: a flat white bar with a few
 * primary destinations (active one in brand blue) plus a "More" button that
 * slides up a sheet with the remaining sections, so nothing is lost on phones.
 */
export function MobileTabBar({
  primary,
  more,
  activeHref,
  alertCount = 0,
}: {
  primary: NavItem[];
  more: NavItem[];
  activeHref: string;
  alertCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const badge = alertCount > 9 ? "9+" : String(alertCount);
  const isActive = (href: string) => activeHref === href || activeHref.startsWith(href + "/");
  const moreActive = more.some((m) => isActive(m.href));

  return (
    <>
      <nav
        className="cs-safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[var(--color-cs-border)] bg-white/95 px-1 pt-1.5 backdrop-blur lg:hidden"
        aria-label="Main"
      >
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showCount = href === "/alerts" && alertCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-1.5 pt-1 text-[10px] font-semibold ${
                active ? "text-[var(--color-cs-brand)]" : "text-[var(--color-cs-text-secondary)]"
              }`}
            >
              <span className="relative">
                <Icon size={22} stroke={active ? 2 : 1.7} aria-hidden />
                {showCount && (
                  <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--color-cs-danger)] px-1 text-[8px] font-bold leading-none text-white">
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 pb-1.5 pt-1 text-[10px] font-semibold ${
            moreActive ? "text-[var(--color-cs-brand)]" : "text-[var(--color-cs-text-secondary)]"
          }`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <IconDots size={22} stroke={moreActive ? 2 : 1.7} aria-hidden />
          More
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <div
            className="absolute inset-0 bg-[var(--color-cs-navy)]/40"
            onClick={() => setOpen(false)}
          />
          <div className="cs-safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-7 shadow-[var(--shadow-cs-float)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-cs-border)]" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-cs-text)]">More</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-text-secondary)]"
                aria-label="Close"
              >
                <IconX size={18} stroke={1.8} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {more.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[12px] font-semibold ${
                      active
                        ? "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                        : "bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]"
                    }`}
                  >
                    <Icon size={22} stroke={1.7} aria-hidden />
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[12px] font-semibold ${
                  isActive("/settings")
                    ? "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                    : "bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]"
                }`}
              >
                <IconSettings size={22} stroke={1.7} aria-hidden />
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
