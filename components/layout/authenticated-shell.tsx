"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "./app-shell";

export function AuthenticatedShell({
  children,
  userName,
  userInitials,
  alertCount = 0,
  isAdmin = false,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  alertCount?: number;
  isAdmin?: boolean;
}) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <AppShell
      activeHref={pathname}
      userName={userName}
      userInitials={userInitials}
      alertCount={alertCount}
      isAdmin={isAdmin}
    >
      {children}
    </AppShell>
  );
}
