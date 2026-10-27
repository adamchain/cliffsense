"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { BeneficiarySwitcherAccount } from "@/components/dashboard/beneficiary-switcher";
import { AppShell } from "./app-shell";

export function AuthenticatedShell({
  children,
  userName,
  userInitials,
  beneficiaryId = null,
  beneficiaryName,
  accounts = [],
  alertCount = 0,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  beneficiaryId?: string | null;
  beneficiaryName?: string;
  accounts?: BeneficiarySwitcherAccount[];
  alertCount?: number;
}) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <AppShell
      activeHref={pathname}
      userName={userName}
      userInitials={userInitials}
      beneficiaryId={beneficiaryId}
      beneficiaryName={beneficiaryName}
      accounts={accounts}
      alertCount={alertCount}
    >
      {children}
    </AppShell>
  );
}
