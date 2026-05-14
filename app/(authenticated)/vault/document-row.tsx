"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconDownload, IconTrash } from "@tabler/icons-react";

export function VaultDocumentRow({
  id,
  filename,
  sizeLabel,
  uploadedLabel,
}: {
  id: string;
  filename: string;
  sizeLabel: string;
  uploadedLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Delete ${filename}? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex items-center justify-between gap-2 text-[12px]">
      <Link
        href={`/vault/${id}`}
        className="min-w-0 flex-1 truncate text-[var(--color-cs-brand)] hover:underline"
        title={filename}
      >
        {filename}
      </Link>
      <span className="shrink-0 text-[10px] text-[var(--color-cs-text-muted)]">
        {sizeLabel} · {uploadedLabel}
      </span>
      <a
        href={`/api/vault/${id}?download=1`}
        className="rounded-sm p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
        aria-label={`Download ${filename}`}
      >
        <IconDownload size={14} stroke={1.5} />
      </a>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-sm p-1 text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)] disabled:opacity-50"
        aria-label={`Delete ${filename}`}
      >
        <IconTrash size={14} stroke={1.5} />
      </button>
      {error && <span className="text-[10px] text-[var(--color-cs-danger)]">{error}</span>}
    </li>
  );
}
