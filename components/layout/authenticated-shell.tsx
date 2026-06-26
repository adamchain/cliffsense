"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "./app-shell";

export function AuthenticatedShell({
  children,
  userName,
  userInitials,
  alertCount = 0,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
  alertCount?: number;
}) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <AppShell
      activeHref={pathname}
      userName={userName}
      userInitials={userInitials}
      alertCount={alertCount}
    >
      {children}
    </AppShell>
  );
}
