"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBan,
  IconCircleCheck,
  IconShieldCheck,
  IconShieldOff,
  IconUserShare,
} from "@tabler/icons-react";

export function UserAdminActions({
  userId,
  email,
  isAdmin,
  status,
  isSelf,
}: {
  userId: string;
  email: string;
  isAdmin: boolean;
  status: "active" | "disabled";
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"admin" | "status" | "impersonate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "Action failed");
      return false;
    }
    return true;
  }

  async function toggleAdmin() {
    if (isAdmin && !confirm(`Revoke admin access from ${email}?`)) return;
    setBusy("admin");
    const ok = await patch({ isAdmin: !isAdmin });
    setBusy(null);
    if (ok) router.refresh();
  }

  async function toggleStatus() {
    const disabling = status === "active";
    if (disabling && !confirm(`Disable ${email}? They will be blocked from signing in.`)) return;
    setBusy("status");
    const ok = await patch({ status: disabling ? "disabled" : "active" });
    setBusy(null);
    if (ok) router.refresh();
  }

  async function impersonate() {
    if (
      !confirm(
        `View the app as ${email}? Your admin session is suspended until you exit, and the action is logged.`,
      )
    )
      return;
    setBusy("impersonate");
    setError(null);
    const res = await fetch(`/api/admin/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "Could not start impersonation");
      setBusy(null);
      return;
    }
    window.location.href = "/dashboard";
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAdmin}
          disabled={busy !== null || (isSelf && isAdmin)}
          title={isSelf && isAdmin ? "You cannot revoke your own admin access" : undefined}
          className={`${btn} border-[var(--color-cs-border)] text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]`}
        >
          {isAdmin ? (
            <IconShieldOff size={16} stroke={1.8} aria-hidden />
          ) : (
            <IconShieldCheck size={16} stroke={1.8} aria-hidden />
          )}
          {busy === "admin" ? "Saving…" : isAdmin ? "Revoke admin" : "Make admin"}
        </button>

        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy !== null || (isSelf && status === "active")}
          title={isSelf && status === "active" ? "You cannot disable your own account" : undefined}
          className={`${btn} ${
            status === "active"
              ? "border-[var(--color-cs-danger)] text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)]"
              : "border-[var(--color-cs-success)] text-[var(--color-cs-success)] hover:bg-[var(--color-cs-success-bg)]"
          }`}
        >
          {status === "active" ? (
            <IconBan size={16} stroke={1.8} aria-hidden />
          ) : (
            <IconCircleCheck size={16} stroke={1.8} aria-hidden />
          )}
          {busy === "status" ? "Saving…" : status === "active" ? "Disable user" : "Enable user"}
        </button>

        {!isSelf && (
          <button
            type="button"
            onClick={impersonate}
            disabled={busy !== null}
            className={`${btn} border-[var(--color-cs-brand)] text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)]`}
          >
            <IconUserShare size={16} stroke={1.8} aria-hidden />
            {busy === "impersonate" ? "Starting…" : "View as user"}
          </button>
        )}
      </div>
      {error && <p className="text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}
