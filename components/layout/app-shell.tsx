import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconBell,
  IconFileExport,
  IconFileText,
  IconFolder,
  IconHome,
  IconListDetails,
  IconMessageCircle,
  IconRepeat,
  IconSettings,
  IconTarget,
} from "@tabler/icons-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { MobileTabBar, type NavItem } from "./mobile-tab-bar";
import { TopbarControls } from "./topbar-controls";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/transactions", label: "Banking", icon: IconListDetails },
  { href: "/recurring", label: "Recurring", icon: IconRepeat },
  { href: "/thresholds", label: "Limits", icon: IconTarget },
  { href: "/alerts", label: "Alerts", icon: IconBell },
  { href: "/documents", label: "Reports & Docs", icon: IconFileText },
  { href: "/advisor", label: "Advisor", icon: IconMessageCircle },
];

/** Secondary/utility destinations — pinned to the bottom of the sidebar in a
 *  smaller, quieter style. */
const secondaryNav: NavItem[] = [
  { href: "/vault", label: "Vault", icon: IconFolder },
  { href: "/reports", label: "Exports", icon: IconFileExport },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

/** The four destinations that get their own slot in the mobile tab bar; the
 *  rest live behind the "More" sheet. */
const PRIMARY_HREFS = ["/dashboard", "/transactions", "/thresholds", "/alerts"];

export function AppShell({
  children,
  userName,
  userInitials,
  activeHref,
  alertCount = 0,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  activeHref: string;
  alertCount?: number;
}) {
  const badge = alertCount > 9 ? "9+" : String(alertCount);
  const primary = nav.filter((n) => PRIMARY_HREFS.includes(n.href));
  // Mobile "More" sheet keeps the secondary destinations too (Settings is
  // appended by the tab bar itself, so it's excluded here to avoid a duplicate).
  const more = [
    ...nav.filter((n) => !PRIMARY_HREFS.includes(n.href)),
    ...secondaryNav.filter((n) => n.href !== "/settings"),
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      {/* ---------- Desktop sidebar (mobile uses the bottom tab bar) ---------- */}
      <nav
        className="hidden w-60 shrink-0 flex-col gap-1 px-3 py-4 lg:flex"
        aria-label="Main"
      >
        {/* Brand sits at the top of the sidebar */}
        <Link
          href="/dashboard"
          className="mb-3 flex items-center gap-2.5 rounded-xl px-2 py-1 hover:opacity-90"
        >
          <BrandMark size="lg" />
          <span className="text-[17px] font-extrabold tracking-tight text-[var(--color-cs-text)]">
            MyBenefitsPA
          </span>
        </Link>
        {nav.map(({ href, label, icon: Icon }) => {
            const active = activeHref === href || activeHref.startsWith(href + "/");
            const showCount = href === "/alerts" && alertCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-[var(--color-cs-brand)] text-white shadow-[0_10px_22px_-12px_rgba(75,99,240,0.85)]"
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
          {/* Utility group pinned to the bottom, smaller and quieter. */}
          <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--color-cs-border)] pt-2">
            {secondaryNav.map(({ href, label, icon: Icon }) => {
              const active = activeHref === href || activeHref.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-cs-brand)] text-white"
                      : "text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
                  }`}
                >
                  <Icon size={18} stroke={active ? 2 : 1.7} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
      </nav>

      {/* ---------- Main column (white) ---------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {/* ---------- Topbar: to the right of the sidebar ---------- */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-cs-border)] bg-white/85 px-4 backdrop-blur sm:px-6">
          {/* Brand shows in the topbar only on mobile (sidebar is hidden there) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl py-1 pr-2 hover:opacity-90 lg:hidden"
          >
            <BrandMark size="lg" />
            <span className="text-[17px] font-extrabold tracking-tight text-[var(--color-cs-text)]">
              MyBenefitsPA
            </span>
          </Link>

          {/* Back/forward + global search, aligned left and spanning the bar */}
          <TopbarControls />

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/alerts"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-cs-text)] shadow-[var(--shadow-cs-card)] hover:text-[var(--color-cs-brand)]"
              aria-label={alertCount > 0 ? `Alerts, ${alertCount} unread` : "Alerts"}
            >
              <IconBell size={19} stroke={1.7} />
              {alertCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-cs-danger)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {badge}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-cs-text)] shadow-[var(--shadow-cs-card)] hover:text-[var(--color-cs-brand)] sm:flex"
              aria-label="Settings"
            >
              <IconSettings size={19} stroke={1.7} />
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-[13px] font-bold text-white"
              title={userName}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Bottom padding on mobile clears the fixed tab bar. */}
        <div className="min-w-0 flex-1 p-4 pb-28 sm:p-6 lg:pb-6">{children}</div>
      </div>

      <MobileTabBar
        primary={primary}
        more={more}
        activeHref={activeHref}
        alertCount={alertCount}
      />
    </div>
  );
}

export function AppToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--color-cs-border)] bg-white p-1.5 text-[13px] shadow-[var(--shadow-cs-card)]">
      {children}
    </div>
  );
}

export function ToolbarButton({
  children,
  primary,
  href,
  onClick,
  disabled,
}: {
  children: ReactNode;
  primary?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = `flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold ${
    primary
      ? "text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)]"
      : "text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
  } ${disabled ? "pointer-events-none opacity-50" : ""}`;
  if (href) {
    return (
      <Link href={href} className={className} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function Card({
  title,
  action,
  actionHref,
  children,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="cs-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">{title}</h2>
        {action && actionHref && (
          <Link
            href={actionHref}
            className="cursor-pointer text-xs font-semibold text-[var(--color-cs-brand)] hover:underline"
          >
            {action}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
