"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCloudUpload } from "@tabler/icons-react";

type Category = { id: string; label: string };

export function VaultUpload({
  beneficiaryId,
  categories,
}: {
  beneficiaryId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]?.id ?? "other");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatus({ kind: "err", text: "Choose a file first." });
      return;
    }
    setUploading(true);
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    form.append("beneficiaryId", beneficiaryId);
    form.append("category", category);
    const res = await fetch("/api/vault/upload", { method: "POST", body: form }).catch(() => null);
    setUploading(false);
    if (!res) {
      setStatus({ kind: "err", text: "Network error" });
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ kind: "err", text: data.error ?? "Upload failed" });
      return;
    }
    setStatus({ kind: "ok", text: `Uploaded ${file.name}.` });
    setFile(null);
    const input = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (input) input.value = "";
    router.refresh();
  }

  return (
    <form
      onSubmit={upload}
      className="rounded border border-dashed border-[var(--color-cs-border)] bg-white p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            File
          </span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[12px] file:mr-3 file:rounded-sm file:border file:border-[var(--color-cs-border)] file:bg-white file:px-3 file:py-1.5 file:text-[12px]"
          />
        </label>
        <label>
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[13px]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          <IconCloudUpload size={14} stroke={1.5} aria-hidden />
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {status && (
        <p
          className={`mt-2 text-[11px] ${
            status.kind === "ok"
              ? "text-[var(--color-cs-success)]"
              : status.kind === "err"
                ? "text-[var(--color-cs-danger)]"
                : "text-[var(--color-cs-info)]"
          }`}
        >
          {status.text}
        </p>
      )}
    </form>
  );
}
