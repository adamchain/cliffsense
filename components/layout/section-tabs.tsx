"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeSectionTabs, isHrefActive } from "./nav-config";

/**
 * Sub-navigation for grouped sections (Money, To-Do, Documents). Renders the
 * active group's children as an underline tab strip beneath the topbar, so the
 * folded sidebar stays simple without hiding the sub-screens.
 */
export function SectionTabs() {
  const pathname = usePathname() ?? "";
  const tabs = activeSectionTabs(pathname);
  if (tabs.length < 2) return null;

  return (
    <div className="border-b border-[var(--color-cs-border)] bg-white px-2 sm:px-5">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isHrefActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-[var(--color-cs-brand)] text-[var(--color-cs-brand)]"
                  : "border-transparent text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
              }`}
            >
              <Icon size={16} stroke={active ? 2 : 1.7} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
