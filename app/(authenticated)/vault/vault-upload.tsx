"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";

export function VaultAddFile({
  beneficiaryId,
  category,
  slot,
  label = "Add",
  documentLabel,
  variant = "inline",
}: {
  beneficiaryId: string;
  category: string;
  slot?: string;
  label?: string;
  documentLabel?: string;
  variant?: "inline" | "prominent";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("beneficiaryId", beneficiaryId);
    form.append("category", category);
    if (slot) form.append("slot", slot);
    const res = await fetch("/api/vault/upload", { method: "POST", body: form }).catch(() => null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res) {
      setError("Network error");
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Upload failed");
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
            PDF, photo, or scan
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label={documentLabel ? `Add ${documentLabel}` : "Add a file"}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="mt-1 max-w-[12rem] text-right text-[11px] text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}
