"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "./app-shell";

export function AuthenticatedShell({
  children,
  userName,
  userInitials,
}: {
  children: ReactNode;
  userName: string;
  userInitials: string;
}) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <AppShell activeHref={pathname} userName={userName} userInitials={userInitials}>
      {children}
    </AppShell>
  );
}
