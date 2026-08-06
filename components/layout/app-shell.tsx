import Link from "next/link";
import type { ReactNode } from "react";
import { IconBell, IconSettings, IconShieldLock } from "@tabler/icons-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { TopbarControls } from "./topbar-controls";
import { SectionTabs } from "./section-tabs";
import {
  ALL_SECTIONS,
  PRIMARY_HREFS,
  PRIMARY_SECTIONS,
  UTILITY_SECTIONS,
  flattenSections,
  isHrefActive,
  sectionIsActive,
  type NavSection,
} from "./nav-config";

/** macOS-style sidebar row — compact 13px with blue selection pill when active. */
function SidebarGroup({
  section,
  activeHref,
  alertCount,
}: {
  section: NavSection;
  activeHref: string;
  alertCount: number;
}) {
  const active = sectionIsActive(activeHref, section);
  const hasChildren = !!section.children?.length;
  const Icon = section.icon;
  const parentActive = !hasChildren && active;
  const containsAlerts =
    section.href === "/alerts" || (section.children ?? []).some((c) => c.href === "/alerts");

  return (
    <div>
      <Link
        href={section.href}
        className={`cs-macos-sidebar-item ${parentActive ? "cs-macos-sidebar-item--active" : ""}`}
      >
        <Icon size={16} stroke={parentActive ? 2 : 1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        {containsAlerts && !parentActive && alertCount > 0 && (
          <span className="cs-macos-sidebar-badge">{alertCount > 9 ? "9+" : alertCount}</span>
        )}
      </Link>

      {hasChildren && active && (
        <div className="mb-0.5 ml-2 flex flex-col gap-0.5 border-l border-black/[0.06] pl-1">
          {section.children!.map(({ href, label, icon: ChildIcon }) => {
            const childActive = isHrefActive(activeHref, href);
            return (
              <Link
                key={href}
                href={href}
                className={`cs-macos-sidebar-item !py-[4px] !text-[12px] ${
                  childActive ? "cs-macos-sidebar-item--active" : ""
                }`}
              >
                <ChildIcon size={14} stroke={childActive ? 2 : 1.75} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {href === "/alerts" && alertCount > 0 && (
                  <span className="cs-macos-sidebar-badge">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ADMIN_SECTION: NavSection = { label: "Admin", icon: IconShieldLock, href: "/admin" };

export function AppShell({
  children,
  userName,
  userInitials,
  activeHref,
  alertCount = 0,
  isAdmin = false,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  activeHref: string;
  alertCount?: number;
  isAdmin?: boolean;
}) {
  const badge = alertCount > 9 ? "9+" : String(alertCount);

  // Mobile tab bar: prototype primaries; More holds Money/Limits/Calendar/Vault/…
  const leaves = flattenSections(ALL_SECTIONS);
  const drawerNav = [
    ...leaves.filter((n) => n.href !== "/settings"),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: IconShieldLock }] : []),
  ];
  // Five prototype tabs; remaining destinations live in the hamburger drawer.
  const tabPrimary = PRIMARY_HREFS.map((href) => leaves.find((n) => n.href === href)).filter(
    (n): n is (typeof leaves)[number] => Boolean(n),
  );
  const tabMore: typeof leaves = [];

  return (
    <div className="flex min-h-screen bg-[var(--color-cs-surface)] font-sans text-[15px] text-[var(--color-cs-text)]">
      {/* ---------- Desktop sidebar (macOS style) ---------- */}
      <nav className="cs-macos-sidebar hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start" aria-label="Main">
        <Link href="/dashboard" className="cs-macos-sidebar-brand">
          <BrandMark size="md" />
          <span>MyBenefitsPA</span>
        </Link>

        <div className="cs-macos-sidebar-scroll">
          {PRIMARY_SECTIONS.map((section) => (
            <SidebarGroup
              key={section.label}
              section={section}
              activeHref={activeHref}
              alertCount={alertCount}
            />
          ))}
        </div>

        <div className="cs-macos-sidebar-footer">
          {UTILITY_SECTIONS.map((section) => (
            <SidebarGroup
              key={section.label}
              section={section}
              activeHref={activeHref}
              alertCount={alertCount}
            />
          ))}
          {isAdmin && (
            <SidebarGroup
              section={ADMIN_SECTION}
              activeHref={activeHref}
              alertCount={alertCount}
            />
          )}
        </div>
      </nav>

      {/* ---------- Main column ---------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--color-cs-surface)]">
        {/* Desktop / tablet topbar; mobile pages own their headers */}
        <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-2 border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)]/90 px-4 backdrop-blur sm:gap-3 sm:px-6 lg:flex">
          <TopbarControls />

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/alerts"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-cs-text)] shadow-[var(--shadow-cs-card)] hover:text-[var(--color-cs-brand)]"
              aria-label={alertCount > 0 ? `Alerts, ${alertCount} unread` : "Alerts"}
            >
              <IconBell size={19} stroke={1.7} />
              {alertCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-cs-pa-red)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {badge}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-cs-text)] shadow-[var(--shadow-cs-card)] hover:text-[var(--color-cs-brand)]"
              aria-label="Settings"
            >
              <IconSettings size={19} stroke={1.7} />
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cs-avatar)] text-[13px] font-bold text-white"
              title={userName}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Compact mobile utility row (search + overflow nav) */}
        <div className="flex items-center gap-2 px-4 pt-3 lg:hidden">
          <MobileNavDrawer nav={drawerNav} activeHref={activeHref} alertCount={alertCount} />
          <div className="min-w-0 flex-1">
            <TopbarControls />
          </div>
        </div>

        <SectionTabs />

        <div className="min-w-0 flex-1 px-4 pb-28 pt-2 sm:px-5 lg:p-6 lg:pb-6">{children}</div>
      </div>

      <MobileTabBar
        primary={tabPrimary}
        more={tabMore}
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
