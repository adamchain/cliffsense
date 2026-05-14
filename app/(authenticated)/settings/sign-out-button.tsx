"use client";

import { signOut } from "next-auth/react";
import { IconLogout } from "@tabler/icons-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-sm border border-[var(--color-cs-danger-bg)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)]"
    >
      <IconLogout size={16} stroke={1.5} aria-hidden />
      Sign out
    </button>
  );
}
