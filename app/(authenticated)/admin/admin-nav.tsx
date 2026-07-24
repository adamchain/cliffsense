"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/thresholds", label: "Thresholds" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/banks", label: "Bank health" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/activity", label: "Activity" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--color-cs-border)]">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "border-[var(--color-cs-brand)] text-[var(--color-cs-brand)]"
                : "border-transparent text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
