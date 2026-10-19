import type { ComponentType } from "react";
import {
  IconBell,
  IconBook,
  IconCalendarEvent,
  IconClipboardList,
  IconFileExport,
  IconFileText,
  IconFolder,
  IconHome,
  IconMessageCircle,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";

type IconCmp = ComponentType<{
  size?: number;
  stroke?: number;
  className?: string;
  fill?: string;
  "aria-hidden"?: boolean;
}>;

export type NavItem = { href: string; label: string; icon: IconCmp; newTab?: boolean };
/** A top-level nav group. `href` is where the group label links (its first/home
 *  child). `children`, when present, surface as a sub-tab strip (SectionTabs). */
export type NavSection = {
  label: string;
  icon: IconCmp;
  href: string;
  children?: NavItem[];
  /** Open this destination in a new browser tab. */
  newTab?: boolean;
};

/* ---------------------------------------------------------------------------
 * Sidebar order: Home → Calendar → Programs, then the rest.
 * ------------------------------------------------------------------------- */

export const PRIMARY_SECTIONS: NavSection[] = [
  { label: "Home", icon: IconHome, href: "/dashboard" },
  { label: "Calendar", icon: IconCalendarEvent, href: "/calendar" },
  {
    label: "Programs",
    icon: IconUsers,
    href: "/limits/programs",
    children: [
      { label: "Programs", icon: IconUsers, href: "/limits/programs" },
      { label: "Alerts", icon: IconBell, href: "/limits/alerts" },
      { label: "Limits", icon: IconTarget, href: "/limits" },
      { label: "2026–27 policy", icon: IconClipboardList, href: "/limits/policy" },
    ],
  },
  { label: "Advisor", icon: IconMessageCircle, href: "/advisor" },
  { label: "Forms", icon: IconFileText, href: "/documents" },
  { label: "Money", icon: IconWallet, href: "/transactions" },
];

/** Bottom utility group. Vault leads (rendered as a card in the sidebar). */
export const UTILITY_SECTIONS: NavSection[] = [
  { label: "Vault", icon: IconFolder, href: "/vault" },
  { label: "Exports", icon: IconFileExport, href: "/reports" },
  { label: "Guides", icon: IconBook, href: "/guides", newTab: true },
];

export const ALL_SECTIONS: NavSection[] = [...PRIMARY_SECTIONS, ...UTILITY_SECTIONS];

/** Primary destinations for the mobile tab bar. */
export const PRIMARY_HREFS = [
  "/dashboard",
  "/calendar",
  "/limits",
  "/documents",
  "/transactions",
];

export function isHrefActive(activeHref: string, href: string): boolean {
  if (href === "/limits") {
    return (
      activeHref === "/limits" ||
      activeHref === "/thresholds" ||
      activeHref.startsWith("/thresholds/")
    );
  }
  if (href === "/limits/alerts") {
    return (
      activeHref === "/limits/alerts" ||
      activeHref === "/alerts" ||
      activeHref.startsWith("/alerts/")
    );
  }
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
    else out.push({ href: s.href, label: s.label, icon: s.icon, newTab: s.newTab });
  }
  return out;
}

/** Child tabs for whichever section the current path is in (empty if none). */
export function activeSectionTabs(activeHref: string): NavItem[] {
  const section = ALL_SECTIONS.find((s) => sectionIsActive(activeHref, s));
  return section?.children ?? [];
}
