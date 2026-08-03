"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useState } from "react";
import { IconDots, IconX } from "@tabler/icons-react";

type IconCmp = ComponentType<{ size?: number; stroke?: number; className?: string; fill?: string }>;
export type NavItem = { href: string; label: string; icon: IconCmp };

/**
 * iOS-style frosted tab bar: primary destinations + More sheet for the rest.
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
        className="cs-safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-black/10 bg-[rgba(248,248,250,0.82)] px-1 pt-2 backdrop-blur-[22px] backdrop-saturate-150 lg:hidden"
        aria-label="Main"
      >
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showCount = href === "/alerts" && alertCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-1 text-[10px] font-medium ${
                active ? "text-[var(--color-cs-brand)]" : "text-[#9a9aa0]"
              }`}
            >
              <span className="relative">
                <Icon
                  size={26}
                  stroke={active ? 1.9 : 1.8}
                  className={active && href === "/dashboard" ? "fill-current" : undefined}
                  aria-hidden
                />
                {showCount && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-cs-pa-red)] px-1 text-[10px] font-bold leading-none text-white">
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
        {more.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-1 text-[10px] font-medium ${
              moreActive ? "text-[var(--color-cs-brand)]" : "text-[#9a9aa0]"
            }`}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <IconDots size={26} stroke={1.8} aria-hidden />
            More
          </button>
        )}
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="cs-safe-bottom absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[22px] bg-[var(--color-cs-surface)] pb-16 pt-2 shadow-[var(--shadow-cs-float)]">
            <div className="mx-auto mb-2 h-[5px] w-[38px] rounded-full bg-[var(--color-cs-text-muted)]" />
            <div className="mb-1 flex items-center justify-between px-5">
              <h2 className="text-[22px] font-bold tracking-tight text-[var(--color-cs-text)]">More</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cs-circbtn"
                aria-label="Close"
              >
                <IconX size={18} stroke={1.8} />
              </button>
            </div>
            <p className="mb-3 px-5 text-[13.5px] text-[var(--color-cs-text-secondary)]">
              Money, limits, calendar, and account tools.
            </p>
            <div className="mx-4 overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {more.map(({ href, label, icon: Icon }, i) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`cs-ios-row ${i > 0 ? "" : ""} ${
                      active ? "text-[var(--color-cs-brand)]" : "text-[var(--color-cs-text)]"
                    }`}
                  >
                    <span
                      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--color-cs-brand)] text-white"
                      aria-hidden
                    >
                      <Icon size={18} stroke={1.8} />
                    </span>
                    <span className="flex-1 text-[16px] font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
