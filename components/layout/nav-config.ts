import type { ComponentType } from "react";
import {
  IconBell,
  IconCalendarEvent,
  IconFileExport,
  IconFileText,
  IconFolder,
  IconHelpCircle,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconTarget,
  IconWallet,
} from "@tabler/icons-react";

type IconCmp = ComponentType<{
  size?: number;
  stroke?: number;
  className?: string;
  fill?: string;
  "aria-hidden"?: boolean;
}>;

export type NavItem = { href: string; label: string; icon: IconCmp };
/** A top-level nav group. `href` is where the group label links (its first/home
 *  child). `children`, when present, surface as a sub-tab strip (SectionTabs). */
export type NavSection = { label: string; icon: IconCmp; href: string; children?: NavItem[] };

/* ---------------------------------------------------------------------------
 * Folded navigation. Money is a single page (income + expenses, with accounts
 * embedded). To-Do keeps Alerts/Calendar tabs. Paperwork (reports & docs) is a
 * top destination. The utility group at the bottom leads with the Vault (shown
 * as a card) and then Exports, Help, Settings.
 * ------------------------------------------------------------------------- */

export const PRIMARY_SECTIONS: NavSection[] = [
  { label: "Home", icon: IconHome, href: "/dashboard" },
  { label: "Money", icon: IconWallet, href: "/transactions" },
  { label: "Limits", icon: IconTarget, href: "/thresholds" },
  {
    label: "To-Do",
    icon: IconBell,
    href: "/alerts",
    children: [
      { href: "/alerts", label: "Alerts", icon: IconBell },
      { href: "/calendar", label: "Calendar", icon: IconCalendarEvent },
    ],
  },
  { label: "Advisor", icon: IconMessageCircle, href: "/advisor" },
  { label: "Paperwork", icon: IconFileText, href: "/documents" },
];

/** Bottom utility group. Vault leads (rendered as a card in the sidebar). */
export const UTILITY_SECTIONS: NavSection[] = [
  { label: "Vault", icon: IconFolder, href: "/vault" },
  { label: "Exports", icon: IconFileExport, href: "/reports" },
  { label: "Help", icon: IconHelpCircle, href: "/help" },
  { label: "Settings", icon: IconSettings, href: "/settings" },
];

export const ALL_SECTIONS: NavSection[] = [...PRIMARY_SECTIONS, ...UTILITY_SECTIONS];

/** The four destinations that get their own slot in the mobile tab bar. */
export const PRIMARY_HREFS = ["/dashboard", "/transactions", "/thresholds", "/alerts"];

export function isHrefActive(activeHref: string, href: string): boolean {
  return activeHref === href || activeHref.startsWith(href + "/");
}

export function sectionIsActive(activeHref: string, s: NavSection): boolean {
  if (isHrefActive(activeHref, s.href)) return true;
  return (s.children ?? []).some((c) => isHrefActive(activeHref, c.href));
}

/** Flatten groups to their leaf destinations (for the mobile drawer / tab bar). */
export function flattenSections(sections: NavSection[]): NavItem[] {
  const out: NavItem[] = [];
  for (const s of sections) {
    if (s.children && s.children.length > 0) out.push(...s.children);
    else out.push({ href: s.href, label: s.label, icon: s.icon });
  }
  return out;
}

/** Child tabs for whichever section the current path is in (empty if none). */
export function activeSectionTabs(activeHref: string): NavItem[] {
  const section = ALL_SECTIONS.find((s) => sectionIsActive(activeHref, s));
  return section?.children ?? [];
}
