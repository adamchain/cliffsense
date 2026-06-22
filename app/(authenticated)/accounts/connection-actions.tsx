"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh, IconUnlink, IconRefreshAlert } from "@tabler/icons-react";
import { PlaidConnectButton } from "@/components/plaid/plaid-connect-button";

export function AccountConnectionActions({
  connectionId,
  beneficiaryId,
  institutionName,
  needsReauth = false,
}: {
  connectionId: string;
  beneficiaryId: string;
  institutionName: string;
  needsReauth?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  async function sync() {
    setBusy("sync");
    setError(null);
    const res = await fetch("/api/plaid/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, bankConnectionId: connectionId }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Sync failed");
      return;
    }
    router.refresh();
  }

  async function disconnect() {
    if (!confirm(`Disconnect ${institutionName}? This removes its transactions from MyBenefitsPA.`)) {
      return;
    }
    setBusy("disconnect");
    setError(null);
    const res = await fetch(`/api/plaid/items/${connectionId}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Disconnect failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-cs-border)] pt-3">
      {needsReauth && (
        <div className="flex flex-col gap-2 rounded border border-[var(--color-cs-warning-bg)] bg-[var(--color-cs-warning-bg)] p-2 text-[12px] text-[var(--color-cs-warning)]">
          <span>
            Your bank needs to be reconnected. Plaid no longer has live access until you re-authenticate.
          </span>
          {reconnecting ? (
            <PlaidConnectButton
              beneficiaryId={beneficiaryId}
              bankConnectionId={connectionId}
              onConnected={() => {
                setReconnecting(false);
                router.refresh();
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setReconnecting(true)}
              className="inline-flex items-center gap-1.5 self-start rounded-sm bg-[var(--color-cs-brand)] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
            >
              <IconRefreshAlert size={14} stroke={1.5} aria-hidden />
              Reconnect {institutionName}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={sync}
          disabled={busy !== null || needsReauth}
          className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-cs-border)] px-2.5 py-1 text-[12px] hover:bg-[var(--color-cs-nav-hover)] disabled:opacity-50"
        >
          <IconRefresh size={14} stroke={1.5} aria-hidden className={busy === "sync" ? "animate-spin" : ""} />
          {busy === "sync" ? "Syncing…" : "Sync"}
        </button>
        <button
          type="button"
          onClick={disconnect}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-cs-border)] px-2.5 py-1 text-[12px] text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)] disabled:opacity-50"
        >
          <IconUnlink size={14} stroke={1.5} aria-hidden />
          {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
        </button>
        {error && <span className="text-[11px] text-[var(--color-cs-danger)]">{error}</span>}
      </div>
    </div>
  );
}
