"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { IconTrash } from "@tabler/icons-react";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setBusy(false);
      setError((json as { error?: string }).error ?? "Could not delete account");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm border border-[var(--color-cs-danger-bg)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)]"
      >
        <IconTrash size={16} stroke={1.5} aria-hidden />
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded border border-[var(--color-cs-danger-bg)] p-3">
      <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
        This permanently deletes your account, every beneficiary you own, their bank links (revoked at Plaid),
        transactions, alerts, documents, and exports. This cannot be undone. Type <strong>DELETE</strong> to confirm.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5 text-[13px]"
        />
        <button
          type="button"
          disabled={busy || confirm !== "DELETE"}
          onClick={() => void remove()}
          className="rounded-sm bg-[var(--color-cs-danger)] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm px-3 py-1.5 text-[13px] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}
