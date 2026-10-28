"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconCreditCard,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconPlus,
  IconTrash,
  IconX,
  IconCopy,
  IconExternalLink,
} from "@tabler/icons-react";

type Kind = "login" | "card";

type SecretItem = {
  id: string;
  kind: Kind;
  label: string;
  url: string;
  username: string;
  cardCategory: string;
  hint: string;
  notes: string;
  updatedAt: string;
};

const CARD_CATEGORIES = [
  { value: "insurance", label: "Insurance" },
  { value: "medicaid", label: "Medicaid" },
  { value: "medicare", label: "Medicare" },
  { value: "pharmacy", label: "Pharmacy / Rx" },
  { value: "id", label: "ID card" },
  { value: "other", label: "Other" },
];

const inputCls =
  "w-full rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]";

export function SecureItemsPanel({
  beneficiaryId,
  canWrite,
  available,
}: {
  beneficiaryId: string;
  canWrite: boolean;
  available: boolean;
}) {
  const [items, setItems] = useState<SecretItem[]>([]);
  const [tab, setTab] = useState<Kind>("login");
  const [adding, setAdding] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault/secrets?beneficiaryId=${beneficiaryId}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reveal = useCallback(
    async (id: string) => {
      if (revealed[id]) {
        setRevealed((r) => {
          const next = { ...r };
          delete next[id];
          return next;
        });
        return;
      }
      const res = await fetch(`/api/vault/secrets/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setRevealed((r) => ({ ...r, [id]: data.data ?? {} }));
    },
    [revealed],
  );

  const remove = useCallback(async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This can't be undone.`)) return;
    await fetch(`/api/vault/secrets/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const shown = items.filter((i) => i.kind === tab);

  return (
    <section className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-[var(--color-cs-text)]">
          <IconLock size={18} stroke={1.8} aria-hidden />
          Secure items
        </h2>
        <div className="inline-flex rounded-full bg-[var(--color-cs-surface)] p-0.5 text-[12.5px]">
          {(["login", "card"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                setAdding(false);
              }}
              className={`rounded-full px-3 py-1 font-medium ${
                tab === k
                  ? "bg-[var(--color-cs-card)] text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[var(--color-cs-text-secondary)]"
              }`}
            >
              {k === "login" ? "Logins" : "Cards"}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-[12px] text-[var(--color-cs-text-secondary)]">
        {tab === "login"
          ? "Account sign-ins (SSA.gov, COMPASS, bank portals). Passwords are encrypted and only shown when you reveal them."
          : "Insurance, Medicaid, Medicare and ID cards. Numbers are encrypted at rest."}
      </p>

      {!available ? (
        <div className="rounded-[12px] bg-[var(--color-cs-surface)] px-4 py-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          Secure storage isn&apos;t enabled yet. Set <code>VAULT_SECRET_KEY</code> to store logins and
          cards.
        </div>
      ) : (
        <>
          {loading ? (
            <p className="py-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">Loading…</p>
          ) : shown.length === 0 && !adding ? (
            <div className="rounded-[12px] bg-[var(--color-cs-surface)] px-4 py-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
              No {tab === "login" ? "logins" : "cards"} saved yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((item) => (
                <SecretRow
                  key={item.id}
                  item={item}
                  revealed={revealed[item.id]}
                  onReveal={() => reveal(item.id)}
                  onDelete={() => remove(item.id, item.label)}
                  canWrite={canWrite}
                />
              ))}
            </ul>
          )}

          {canWrite && adding && (
            <AddSecretForm
              beneficiaryId={beneficiaryId}
              kind={tab}
              onDone={(created) => {
                setAdding(false);
                if (created) void load();
              }}
            />
          )}

          {canWrite && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cs-brand-soft)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-cs-brand)]"
            >
              <IconPlus size={16} stroke={2} aria-hidden />
              Add {tab === "login" ? "login" : "card"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="rounded p-1 text-[var(--color-cs-text-muted)] hover:text-[var(--color-cs-brand)]"
      aria-label="Copy"
      title="Copy"
    >
      {copied ? <span className="text-[10px] font-semibold text-[var(--color-cs-brand)]">✓</span> : <IconCopy size={13} aria-hidden />}
    </button>
  );
}

function SecretRow({
  item,
  revealed,
  onReveal,
  onDelete,
  canWrite,
}: {
  item: SecretItem;
  revealed: Record<string, string> | undefined;
  onReveal: () => void;
  onDelete: () => void;
  canWrite: boolean;
}) {
  const Icon = item.kind === "login" ? IconKey : IconCreditCard;
  return (
    <li className="rounded-[14px] bg-[var(--color-cs-surface)] p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[var(--color-cs-text-muted)]">
          <Icon size={18} stroke={1.8} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold text-[var(--color-cs-text)]">
              {item.label}
            </span>
            {item.hint && (
              <span className="text-[11px] text-[var(--color-cs-text-muted)]">••{item.hint}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[var(--color-cs-text-secondary)]">
            {item.username && <span>{item.username}</span>}
            {item.cardCategory && <span className="capitalize">{item.cardCategory}</span>}
            {item.url && (
              <a
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[var(--color-cs-brand)] hover:underline"
              >
                Open <IconExternalLink size={11} aria-hidden />
              </a>
            )}
          </div>
          {item.notes && (
            <p className="mt-1 text-[12px] text-[var(--color-cs-text-muted)]">{item.notes}</p>
          )}

          {revealed && (
            <dl className="mt-2 flex flex-col gap-1 rounded-[10px] bg-[var(--color-cs-card)] p-2.5">
              {Object.entries(revealed).map(([key, value]) =>
                value ? (
                  <div key={key} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <dt className="capitalize text-[var(--color-cs-text-secondary)]">{key}</dt>
                    <dd className="flex items-center gap-1 font-mono text-[var(--color-cs-text)]">
                      <span className="break-all">{value}</span>
                      <CopyButton value={value} />
                    </dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onReveal}
            className="rounded-lg p-1.5 text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-card)] hover:text-[var(--color-cs-text)]"
            aria-label={revealed ? "Hide" : "Reveal"}
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <IconEyeOff size={16} aria-hidden /> : <IconEye size={16} aria-hidden />}
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-card)] hover:text-[#c0392b]"
              aria-label="Delete"
              title="Delete"
            >
              <IconTrash size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function AddSecretForm({
  beneficiaryId,
  kind,
  onDone,
}: {
  beneficiaryId: string;
  kind: Kind;
  onDone: (created: boolean) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cardCategory, setCardCategory] = useState("insurance");
  const [number, setNumber] = useState("");
  const [memberId, setMemberId] = useState("");
  const [groupNumber, setGroupNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!label.trim()) {
      setError("Add a label.");
      return;
    }
    setSaving(true);
    setError(null);
    const data: Record<string, string> =
      kind === "login"
        ? { password }
        : { number, memberId, groupNumber };
    const body = {
      beneficiaryId,
      kind,
      label: label.trim(),
      url: kind === "login" ? url.trim() : "",
      username: kind === "login" ? username.trim() : "",
      cardCategory: kind === "card" ? cardCategory : "",
      notes: notes.trim(),
      data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "")),
    };
    const res = await fetch("/api/vault/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save.");
      return;
    }
    onDone(true);
  }

  return (
    <div className="mt-3 rounded-[14px] border border-[var(--color-cs-sep)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[var(--color-cs-text)]">
          New {kind === "login" ? "login" : "card"}
        </span>
        <button type="button" onClick={() => onDone(false)} aria-label="Cancel">
          <IconX size={16} className="text-[var(--color-cs-text-muted)]" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={kind === "login" ? "e.g. SSA.gov account" : "e.g. Aetna insurance card"}
          className={inputCls}
        />
        {kind === "login" ? (
          <>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Login URL (optional)" className={inputCls} />
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username or email" className={inputCls} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className={inputCls} />
          </>
        ) : (
          <>
            <select value={cardCategory} onChange={(e) => setCardCategory(e.target.value)} className={inputCls}>
              {CARD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Card / policy number" className={inputCls} />
            <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member ID (optional)" className={inputCls} />
            <input value={groupNumber} onChange={(e) => setGroupNumber(e.target.value)} placeholder="Group number (optional)" className={inputCls} />
          </>
        )}
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (not secret, optional)" className={inputCls} />
        {error && <p className="text-[12px] text-[#c0392b]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDone(false)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-cs-text-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-full bg-[var(--color-cs-brand)] px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
