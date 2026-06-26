"use client";

import { useState } from "react";
import { IconEye, IconLogout } from "@tabler/icons-react";

/**
 * Persistent floating indicator shown while an admin is impersonating a user.
 * Sits clear of the mobile tab bar and stays visible on scroll so it's never
 * forgotten. "Exit" restores the admin session.
 */
export function ImpersonationBanner({ email }: { email?: string }) {
  const [busy, setBusy] = useState(false);

  async function exit() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
    } finally {
      window.location.href = "/admin/users";
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-24 z-[70] flex justify-center px-3 lg:bottom-4">
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-cs-warning)] bg-[var(--color-cs-warning-bg)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-cs-warning)] shadow-[var(--shadow-cs-float)]">
        <IconEye size={16} stroke={1.9} aria-hidden />
        <span className="truncate">
          Viewing as <span className="font-bold">{email ?? "user"}</span>
        </span>
        <button
          type="button"
          onClick={exit}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-cs-warning)] px-3 py-1 text-white disabled:opacity-60"
        >
          <IconLogout size={14} stroke={2} aria-hidden />
          {busy ? "Exiting…" : "Exit"}
        </button>
      </div>
    </div>
  );
}
