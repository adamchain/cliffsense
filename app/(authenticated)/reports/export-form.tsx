"use client";

import { useCallback, useEffect, useState } from "react";
import { IconDownload, IconFileExport, IconTrash } from "@tabler/icons-react";

type Format = "csv" | "pdf" | "json" | "zip";
type Dataset = "transactions" | "recurring" | "alerts" | "thresholds" | "activity" | "bundle";

const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: "csv", label: "CSV", hint: "Spreadsheet-friendly" },
  { id: "json", label: "JSON", hint: "Machine readable" },
  { id: "pdf", label: "PDF", hint: "Printable report" },
  { id: "zip", label: "ZIP bundle", hint: "CSV + JSON archive" },
];

const DATASETS: { id: Dataset; label: string }[] = [
  { id: "transactions", label: "Transactions" },
  { id: "recurring", label: "Recurring streams" },
  { id: "alerts", label: "Alerts" },
  { id: "thresholds", label: "Thresholds" },
  { id: "activity", label: "Activity log" },
  { id: "bundle", label: "Everything (audit bundle)" },
];

type ExportRow = {
  id: string;
  format: Format;
  dataset: Dataset;
  from: string;
  to: string;
  status: "queued" | "ready" | "failed";
  failureReason?: string;
  filename: string;
  sizeBytes: number;
  rowCount: number;
  createdAt: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ExportForm({ beneficiaryId }: { beneficiaryId: string }) {
  const [format, setFormat] = useState<Format>("csv");
  const [dataset, setDataset] = useState<Dataset>("transactions");
  const [from, setFrom] = useState(isoDaysAgo(90));
  const [to, setTo] = useState(todayIso());
  const [list, setList] = useState<ExportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    const res = await fetch(`/api/exports?beneficiaryId=${encodeURIComponent(beneficiaryId)}`);
    setLoadingList(false);
    if (!res.ok) return;
    const data = (await res.json().catch(() => ({}))) as { exports?: ExportRow[] };
    setList(data.exports ?? []);
  }, [beneficiaryId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function queueExport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, format, dataset, from, to }),
    }).catch(() => null);
    setSubmitting(false);
    if (!res) {
      setError("Network error");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Export failed");
      return;
    }
    if (data.status === "failed") {
      setError(data.error ?? "Export failed");
    }
    await loadList();
  }

  async function remove(id: string) {
    if (!confirm("Delete this export?")) return;
    const res = await fetch(`/api/exports/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await loadList();
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <form
        onSubmit={queueExport}
        className="md:col-span-2 space-y-4 rounded border border-[var(--color-cs-border)] bg-white p-4"
      >
        <div>
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Format</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORMATS.map((f) => (
              <label
                key={f.id}
                className={`cursor-pointer rounded border px-3 py-2 text-[12px] ${
                  format === f.id
                    ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)]"
                    : "border-[var(--color-cs-border)] hover:bg-[var(--color-cs-nav-hover)]"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f.id}
                  checked={format === f.id}
                  onChange={() => setFormat(f.id)}
                  className="sr-only"
                />
                <div className="font-medium">{f.label}</div>
                <div className="text-[11px] text-[var(--color-cs-text-secondary)]">{f.hint}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Dataset</h2>
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value as Dataset)}
            className="h-9 w-full max-w-xs rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[13px]"
          >
            {DATASETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2 text-[13px]"
            />
          </label>
        </div>

        {error && <p className="text-[12px] text-[var(--color-cs-warning)]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          <IconFileExport size={16} stroke={1.5} aria-hidden />
          {submitting ? "Generating…" : "Generate export"}
        </button>
      </form>

      <aside className="rounded border border-[var(--color-cs-border)] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--color-cs-text)]">Recent exports</h2>
          <button
            type="button"
            onClick={() => void loadList()}
            className="text-[11px] text-[var(--color-cs-brand)] hover:underline"
          >
            Refresh
          </button>
        </div>
        {loadingList && list.length === 0 ? (
          <p className="text-[12px] text-[var(--color-cs-text-secondary)]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
            No exports yet. Generate one to see it here with a download link.
          </p>
        ) : (
          <ul className="space-y-2 text-[12px]">
            {list.map((q) => (
              <li key={q.id} className="rounded border border-[var(--color-cs-border)] p-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium uppercase text-[var(--color-cs-text)]">
                    {q.format} · {q.dataset}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide ${
                      q.status === "ready"
                        ? "text-[var(--color-cs-success)]"
                        : q.status === "failed"
                          ? "text-[var(--color-cs-danger)]"
                          : "text-[var(--color-cs-text-secondary)]"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-cs-text-secondary)]">
                  {q.from || "all time"} → {q.to || "now"} · {q.rowCount} rows
                </div>
                {q.failureReason && (
                  <div className="mt-1 text-[11px] text-[var(--color-cs-danger)]">
                    {q.failureReason}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  {q.status === "ready" && (
                    <>
                      <a
                        href={`/api/exports/${q.id}?download=1`}
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--color-cs-brand)] hover:underline"
                      >
                        <IconDownload size={12} stroke={1.5} aria-hidden />
                        Download
                      </a>
                      <span className="text-[10px] text-[var(--color-cs-text-muted)]">
                        {formatBytes(q.sizeBytes)}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(q.id)}
                    className="ml-auto text-[11px] text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-danger)]"
                    aria-label="Delete export"
                  >
                    <IconTrash size={12} stroke={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
