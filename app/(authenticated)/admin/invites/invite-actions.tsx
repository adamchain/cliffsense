"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";

export function RevokeInviteButton({ inviteId, email }: { inviteId: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (!confirm(`Revoke the pending invite to ${email}? The link will stop working.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/invites/${inviteId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={revoke}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-cs-danger)] px-2 py-1 text-[11px] font-medium text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)] disabled:opacity-50"
      >
        <IconX size={13} stroke={1.8} aria-hidden />
        {busy ? "…" : "Revoke"}
      </button>
      {error && <span className="text-[10px] text-[var(--color-cs-danger)]">{error}</span>}
    </div>
  );
}
