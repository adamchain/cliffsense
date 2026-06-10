"use client";

import { useCallback, useEffect, useState } from "react";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";

type AccessRow = { userId: string; email: string; name: string; role: string; isSelf: boolean };
type InviteRow = { id: string; email: string; role: string; expiresAt: string };
type Payload = { access: AccessRow[]; invites: InviteRow[] };

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  co_manager: "Co-manager",
  viewer: "Viewer",
};

export function SharingPanel({ beneficiaryId }: { beneficiaryId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"co_manager" | "viewer">("viewer");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/sharing`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Failed to load sharing");
      return;
    }
    setData(json as Payload);
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/sharing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Could not send invite");
      return;
    }
    setEmail("");
    setNotice(`Invitation sent to ${email.trim()}.`);
    await load();
  }

  async function revokeInvite(inviteId: string) {
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/invites/${inviteId}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  async function revokeAccess(userId: string) {
    if (!confirm("Remove this person's access?")) return;
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/access/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  return (
    <div className="text-[13px]">
      <form onSubmit={invite} className="mb-3 flex flex-wrap items-end gap-2">
        <label className="block flex-1 min-w-[180px]">
          <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Invite by email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@example.com"
            className="w-full rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-xs text-[var(--color-cs-text-secondary)]">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "co_manager" | "viewer")}
            className="rounded-sm border border-[var(--color-cs-border)] px-2 py-1.5"
          >
            <option value="viewer">Viewer (read-only)</option>
            <option value="co_manager">Co-manager (can edit)</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-cs-brand)] px-3 py-1.5 text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          <IconUserPlus size={16} stroke={1.5} aria-hidden />
          {busy ? "Sending…" : "Invite"}
        </button>
      </form>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}
      {notice && <p className="mb-2 text-xs text-[#107c10]">{notice}</p>}

      <div className="space-y-1.5">
        {data?.access.map((a) => (
          <div
            key={a.userId}
            className="flex items-center justify-between gap-2 rounded border border-[var(--color-cs-border)] px-3 py-1.5"
          >
            <div>
              <span className="font-medium text-[var(--color-cs-text)]">{a.email || a.name || "User"}</span>
              <span className="ml-2 text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                {ROLE_LABEL[a.role] ?? a.role}
                {a.isSelf ? " · you" : ""}
              </span>
            </div>
            {a.role !== "owner" && !a.isSelf && (
              <button
                type="button"
                title="Remove access"
                onClick={() => void revokeAccess(a.userId)}
                className="inline-flex rounded p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-danger)]"
              >
                <IconTrash size={16} stroke={1.5} />
              </button>
            )}
          </div>
        ))}

        {data?.invites.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-2 rounded border border-dashed border-[var(--color-cs-border)] px-3 py-1.5"
          >
            <div>
              <span className="text-[var(--color-cs-text)]">{i.email}</span>
              <span className="ml-2 text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                {ROLE_LABEL[i.role] ?? i.role} · pending
              </span>
            </div>
            <button
              type="button"
              title="Revoke invite"
              onClick={() => void revokeInvite(i.id)}
              className="inline-flex rounded p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-danger)]"
            >
              <IconTrash size={16} stroke={1.5} />
            </button>
          </div>
        ))}

        {data && data.access.length === 0 && data.invites.length === 0 && (
          <p className="text-[12px] text-[var(--color-cs-text-secondary)]">No one else has access yet.</p>
        )}
      </div>
    </div>
  );
}
