"use client";

import { signOut } from "next-auth/react";
import { IconLogout } from "@tabler/icons-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-cs-card)] px-3 py-3.5 text-[16px] font-medium text-[var(--color-cs-danger)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[var(--color-cs-danger-bg)]"
    >
      <IconLogout size={16} stroke={1.5} aria-hidden />
      Sign out
    </button>
  );
}
