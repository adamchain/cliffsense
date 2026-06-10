"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError((json as { error?: string }).error ?? "Could not accept invitation");
      return;
    }
    const beneficiaryId = (json as { beneficiaryId?: string }).beneficiaryId;
    router.push(beneficiaryId ? `/beneficiaries/${beneficiaryId}` : "/dashboard");
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void accept()}
        disabled={busy}
        className="rounded-sm bg-[var(--color-cs-brand)] px-4 py-2 text-sm text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
      >
        {busy ? "Accepting…" : "Accept invitation"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}
