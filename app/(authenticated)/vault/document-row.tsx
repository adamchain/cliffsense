"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconDownload, IconFileText, IconFileWord, IconTrash } from "@tabler/icons-react";

function FileGlyph({ docx, size }: { docx: boolean; size: number }) {
  if (docx) {
    return <IconFileWord size={size} stroke={1.7} className="text-[#2b579a]" aria-hidden />;
  }
  return <IconFileText size={size} stroke={1.7} className="text-[var(--color-cs-text-secondary)]" aria-hidden />;
}

export function VaultDocumentRow({
  id,
  filename,
  sizeLabel,
  uploadedLabel,
  docx = false,
  preview = null,
}: {
  id: string;
  filename: string;
  sizeLabel: string;
  uploadedLabel: string;
  docx?: boolean;
  preview?: string | null;
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
    <li className="flex items-start justify-between gap-2 py-1 text-[12px]">
      <span className="mt-0.5">
        <FileGlyph docx={docx} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/vault/${id}`}
          className="block truncate text-[var(--color-cs-brand)] hover:underline"
          title={filename}
        >
          {filename}
        </Link>
        {preview ? (
          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-[11px] leading-snug text-[var(--color-cs-text-secondary)]">
            {preview}
          </p>
        ) : null}
      </div>
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

export function VaultFileCard({
  id,
  filename,
  sizeLabel,
  uploadedLabel,
  docx,
  preview,
}: {
  id: string;
  filename: string;
  sizeLabel: string;
  uploadedLabel: string;
  docx: boolean;
  preview: string | null;
}) {
  return (
    <Link
      href={`/vault/${id}`}
      className="flex flex-col overflow-hidden rounded-[16px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] hover:ring-[var(--color-cs-brand)]/30"
      title={filename}
    >
      <div className="relative h-32 overflow-hidden bg-[#f7f8fa] px-3 py-2.5">
        {preview ? (
          <p className="line-clamp-6 whitespace-pre-wrap text-[11px] leading-snug text-[var(--color-cs-text)]">
            {preview}
          </p>
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileGlyph docx={docx} size={36} />
          </div>
        )}
        {preview ? (
          <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm">
            <FileGlyph docx={docx} size={15} />
          </span>
        ) : null}
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-[12.5px] font-semibold text-[var(--color-cs-text)]">{filename}</div>
        <div className="truncate text-[11px] text-[var(--color-cs-text-secondary)]">
          {docx ? "Word" : "File"} · {sizeLabel} · {uploadedLabel}
        </div>
      </div>
    </Link>
  );
}
