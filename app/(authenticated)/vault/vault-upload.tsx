"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconUpload } from "@tabler/icons-react";

/** Upload one file to the vault. Returns an error string, or null on success. */
async function uploadOne(
  file: File,
  beneficiaryId: string,
  category: string,
  slot?: string,
): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  form.append("beneficiaryId", beneficiaryId);
  form.append("category", category);
  if (slot) form.append("slot", slot);
  const res = await fetch("/api/vault/upload", { method: "POST", body: form }).catch(() => null);
  if (!res) return "Network error";
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Upload failed";
  }
  return null;
}

/** Upload many files, collecting the first error (if any). */
async function uploadMany(
  files: File[],
  beneficiaryId: string,
  category: string,
  slot?: string,
): Promise<string | null> {
  let firstError: string | null = null;
  for (const file of files) {
    const err = await uploadOne(file, beneficiaryId, category, slot);
    if (err && !firstError) firstError = err;
  }
  return firstError;
}

export function VaultAddFile({
  beneficiaryId,
  category,
  slot,
  label = "Add",
  documentLabel,
  variant = "inline",
  multiple = false,
}: {
  beneficiaryId: string;
  category: string;
  slot?: string;
  label?: string;
  documentLabel?: string;
  variant?: "inline" | "prominent";
  /** Allow selecting several files at once (slots stay single-file). */
  multiple?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    const err = await uploadMany(list, beneficiaryId, category, slot);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (err) {
      setError(err);
      return;
    }
    router.refresh();
  }

  const buttonClass =
    variant === "prominent"
      ? "flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--color-cs-brand)] bg-white px-4 py-5 text-center text-[var(--color-cs-brand)] disabled:opacity-50"
      : "inline-flex h-8 items-center gap-1 rounded-full bg-[var(--color-cs-brand-soft)] px-3 text-[12.5px] font-semibold text-[var(--color-cs-brand)] disabled:opacity-50";

  return (
    <div className={variant === "prominent" ? "w-full" : "shrink-0"}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={buttonClass}
      >
        <span className="inline-flex items-center gap-1 font-semibold">
          <IconPlus size={variant === "prominent" ? 18 : 14} stroke={2.2} aria-hidden />
          {uploading ? "Adding…" : label}
        </span>
        {variant === "prominent" ? (
          <span className="text-[12px] font-medium text-[var(--color-cs-text-secondary)]">
            PDF, photo, or scan{multiple ? " · several at once" : ""}
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="sr-only"
        aria-label={documentLabel ? `Add ${documentLabel}` : "Add a file"}
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <p className="mt-1 max-w-[12rem] text-right text-[11px] text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}

/**
 * Drop zone wrapping a folder's content. Dragging files anywhere over it and
 * dropping uploads them all to this folder. Clicking still works via the nested
 * controls; this only adds the drag affordance.
 */
export function VaultDropzone({
  beneficiaryId,
  category,
  children,
}: {
  beneficiaryId: string;
  category: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    const err = await uploadMany(files, beneficiaryId, category);
    setUploading(false);
    if (err) {
      setError(err);
      return;
    }
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        // Only clear when leaving the zone, not when moving over children.
        if (e.currentTarget === e.target) setOver(false);
      }}
      onDrop={handleDrop}
      className={`relative rounded-[14px] transition ${
        over ? "ring-2 ring-[var(--color-cs-brand)] ring-offset-2" : ""
      }`}
    >
      {children}
      {(over || uploading) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[14px] bg-[var(--color-cs-brand-soft)]/80 text-[13px] font-semibold text-[var(--color-cs-brand)]">
          <span className="inline-flex items-center gap-1.5">
            <IconUpload size={16} stroke={2} aria-hidden />
            {uploading ? "Uploading…" : "Drop files to add to this folder"}
          </span>
        </div>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-[var(--color-cs-danger)]">{error}</p>
      )}
    </div>
  );
}
