import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconBell,
  IconFileExport,
  IconFolder,
  IconHelp,
  IconHome,
  IconListDetails,
  IconMessageCircle,
  IconRepeat,
  IconSearch,
  IconSettings,
  IconTarget,
} from "@tabler/icons-react";
import { BrandMark } from "@/components/brand/brand-mark";

const nav = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/transactions", label: "Banking", icon: IconListDetails },
  { href: "/recurring", label: "Recurring", icon: IconRepeat },
  { href: "/thresholds", label: "Limits", icon: IconTarget },
  { href: "/alerts", label: "Alerts", icon: IconBell },
  { href: "/vault", label: "Vault", icon: IconFolder },
  { href: "/reports", label: "Reports", icon: IconFileExport },
  { href: "/advisor", label: "Advisor", icon: IconMessageCircle },
];

export function AppShell({
  children,
  userName,
  userInitials,
  activeHref,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  activeHref: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      <header className="flex h-14 shrink-0 items-center gap-4 bg-[var(--color-cs-brand)] px-4 text-white sm:px-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-md py-0.5 pl-0.5 pr-2 -ml-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          <BrandMark size="xl" />
          <span className="text-[15px] font-semibold tracking-tight sm:text-base">CliffSense</span>
        </Link>
        <div className="hidden max-w-[460px] flex-1 items-center gap-2 rounded bg-white/15 px-3 py-1.5 text-[13px] text-white/85 md:flex">
          <IconSearch size={16} aria-hidden className="opacity-80" />
          <span className="truncate">Search transactions, alerts, documents</span>
        </div>
        <div className="ml-auto flex items-center gap-3.5">
          <Link href="/alerts" className="text-white hover:opacity-90" aria-label="Alerts">
            <IconBell size={18} stroke={1.5} />
          </Link>
          <Link href="/settings" className="text-white hover:opacity-90" aria-label="Settings">
            <IconSettings size={18} stroke={1.5} />
          </Link>
          <span className="text-white hover:opacity-90" aria-label="Help">
            <IconHelp size={18} stroke={1.5} />
          </span>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium"
            style={{ background: "#c19c00" }}
            title={userName}
          >
            {userInitials}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          className="flex w-14 shrink-0 flex-col gap-1 border-r border-[var(--color-cs-border)] bg-white py-2"
          aria-label="Main"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active = activeHref === href || activeHref.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] leading-tight ${
                  active
                    ? "border-l-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-brand)]"
                    : "border-l-2 border-transparent text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
                }`}
              >
                <Icon size={18} stroke={1.5} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1 p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}

export function AppToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-1 rounded border border-[var(--color-cs-border)] bg-white p-1.5 text-[13px]">
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
  const className = `flex items-center gap-1.5 rounded-sm px-2.5 py-1 ${
    primary
      ? "text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
      : "text-[#323130] hover:bg-[var(--color-cs-nav-hover)]"
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
    <section className="rounded border border-[var(--color-cs-border)] bg-white p-4 md:p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-cs-text)]">{title}</h2>
        {action && actionHref && (
          <Link
            href={actionHref}
            className="cursor-pointer text-xs text-[var(--color-cs-brand)] hover:underline"
          >
            {action}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
