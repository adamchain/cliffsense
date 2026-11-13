"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import {
  BeneficiarySwitcher,
  type BeneficiarySwitcherAccount,
} from "@/components/dashboard/beneficiary-switcher";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { GUIDE_SECTION } from "@/components/layout/nav-config";

export function SidebarAccount({
  userName,
  initials,
  beneficiaryId,
  beneficiaryName,
  accounts,
  settingsActive,
}: {
  userName: string;
  initials: string;
  beneficiaryId: string | null;
  beneficiaryName: string;
  accounts: BeneficiarySwitcherAccount[];
  settingsActive: boolean;
}) {
  const currentName = beneficiaryName.trim() || userName;
  const pathname = usePathname() ?? "";
  const GuideIcon = GUIDE_SECTION.icon;
  const guidesActive = pathname === GUIDE_SECTION.href || pathname.startsWith(`${GUIDE_SECTION.href}/`);
  return (
    <div className="mt-1 flex flex-col gap-0.5 border-t border-black/[0.08] pt-1">
      <FeedbackWidget />
      <Link
        href={GUIDE_SECTION.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`cs-macos-sidebar-item ${guidesActive ? "cs-macos-sidebar-item--active" : ""}`}
      >
        <GuideIcon size={16} stroke={guidesActive ? 2 : 1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{GUIDE_SECTION.label}</span>
      </Link>
      <Link
        href="/settings"
        className={`cs-macos-sidebar-item ${settingsActive ? "cs-macos-sidebar-item--active" : ""}`}
        aria-current={settingsActive ? "page" : undefined}
      >
        <IconSettings size={16} stroke={settingsActive ? 2 : 1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate">Settings</span>
      </Link>
      <BeneficiarySwitcher
        variant="sidebar"
        currentId={beneficiaryId}
        currentName={currentName}
        accounts={accounts}
        initials={initials}
      />
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="cs-macos-sidebar-item w-full cursor-pointer border-0 bg-transparent text-left text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)]"
      >
        <IconLogout size={16} stroke={1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">Log out</span>
      </button>
    </div>
  );
}
