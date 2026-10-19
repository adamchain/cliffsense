"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import {
  BeneficiarySwitcher,
  type BeneficiarySwitcherAccount,
} from "@/components/dashboard/beneficiary-switcher";

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
  return (
    <div className="mt-1 flex flex-col gap-0.5 border-t border-black/[0.08] pt-1">
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
