import Link from "next/link";
import type { ReactNode } from "react";
import { IconBell, IconFolder, IconSettings } from "@tabler/icons-react";
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

function AlertBadge({ count, onBrand = false }: { count: number; onBrand?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none ${
        onBrand ? "bg-white/25 text-white" : "bg-[var(--color-cs-danger)] text-white"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** One sidebar group: a parent link, and — when the group is active — its child
 *  destinations revealed beneath it. Leaf groups (no children) render as a
 *  single link. Server-safe (no hooks). */
function SidebarGroup({
  section,
  activeHref,
  alertCount,
  variant,
}: {
  section: NavSection;
  activeHref: string;
  alertCount: number;
  variant: "primary" | "utility";
}) {
  const active = sectionIsActive(activeHref, section);
  const hasChildren = !!section.children?.length;
  const Icon = section.icon;
  const containsAlerts = section.href === "/alerts" || (section.children ?? []).some((c) => c.href === "/alerts");

  const sizing =
    variant === "utility"
      ? "rounded-xl px-4 py-2 text-[13px] font-medium"
      : "rounded-2xl px-4 py-3 text-[14px] font-semibold";
  const idle =
    variant === "utility"
      ? "text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
      : "text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]";

  // Minimalist active style (matches the bottom utility tabs): flat brand fill,
  // no shadow. Group parents stay subtle when active (children carry the state).
  const parentClass = !hasChildren && active
    ? "bg-[var(--color-cs-brand)] text-white"
    : hasChildren && active
      ? "bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-text)]"
      : idle;

  return (
    <div>
      <Link
        href={section.href}
        className={`flex items-center gap-3 transition-colors ${sizing} ${parentClass}`}
      >
        <Icon size={variant === "utility" ? 18 : 20} stroke={active ? 2 : 1.7} aria-hidden />
        {section.label}
        {containsAlerts && !active && <AlertBadge count={alertCount} />}
      </Link>

      {hasChildren && active && (
        <div className="mb-1 mt-0.5 flex flex-col gap-0.5">
          {section.children!.map(({ href, label, icon: ChildIcon }) => {
            const childActive = isHrefActive(activeHref, href);
            return (
              <Link
                key={href}
                href={href}
                className={`ml-3 flex items-center gap-2.5 rounded-xl py-2 pl-6 pr-3 text-[13px] font-medium transition-colors ${
                  childActive
                    ? "bg-[var(--color-cs-brand)] text-white"
                    : "text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
                }`}
              >
                <ChildIcon size={16} stroke={childActive ? 2 : 1.7} aria-hidden />
                {label}
                {href === "/alerts" && <AlertBadge count={alertCount} onBrand={childActive} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Vault gets a distinct card at the top of the utility group. */
function VaultCard({ activeHref }: { activeHref: string }) {
  const active = isHrefActive(activeHref, "/vault");
  return (
    <Link
      href="/vault"
      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        active
          ? "border-transparent bg-[var(--color-cs-brand)] text-white shadow-[0_10px_22px_-12px_rgba(75,99,240,0.85)]"
          : "border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-white/20 text-white" : "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
        }`}
      >
        <IconFolder size={18} stroke={1.8} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold leading-tight">Vault</span>
        <span
          className={`block text-[11px] leading-tight ${
            active ? "text-white/80" : "text-[var(--color-cs-text-secondary)]"
          }`}
        >
          Documents &amp; receipts
        </span>
      </span>
    </Link>
  );
}

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

  // Mobile surfaces use the flattened leaf destinations.
  const leaves = flattenSections(ALL_SECTIONS);
  const drawerNav = leaves.filter((n) => n.href !== "/settings");
  const tabPrimary = leaves.filter((n) => PRIMARY_HREFS.includes(n.href));
  const tabMore = leaves.filter((n) => !PRIMARY_HREFS.includes(n.href) && n.href !== "/settings");

  return (
    <div className="flex min-h-screen bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      {/* ---------- Desktop sidebar (mobile uses the bottom tab bar) ---------- */}
      <nav
        className="hidden w-60 shrink-0 flex-col gap-1 px-3 py-4 lg:flex lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto"
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

        {PRIMARY_SECTIONS.map((section) => (
          <SidebarGroup
            key={section.label}
            section={section}
            activeHref={activeHref}
            alertCount={alertCount}
            variant="primary"
          />
        ))}

        {/* Utility group pinned to the bottom: Vault leads as a card. */}
        <div className="mt-auto flex flex-col gap-2 border-t border-[var(--color-cs-border)] pt-3">
          <VaultCard activeHref={activeHref} />
          <div className="flex flex-col gap-0.5">
            {UTILITY_SECTIONS.filter((s) => s.href !== "/vault").map((section) => (
              <SidebarGroup
                key={section.label}
                section={section}
                activeHref={activeHref}
                alertCount={alertCount}
                variant="utility"
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ---------- Main column (white) ---------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {/* ---------- Topbar: to the right of the sidebar ---------- */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-[var(--color-cs-border)] bg-white/85 px-4 backdrop-blur sm:gap-3 sm:px-6">
          {/* Hamburger opens the full nav drawer on mobile (sidebar is hidden there) */}
          <MobileNavDrawer nav={drawerNav} activeHref={activeHref} alertCount={alertCount} />
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

        {/* Sub-tabs for grouped sections (Money, To-Do, Documents). */}
        <SectionTabs />

        {/* Bottom padding on mobile clears the fixed tab bar. */}
        <div className="min-w-0 flex-1 p-4 pb-28 sm:p-6 lg:pb-6">{children}</div>
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
