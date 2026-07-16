"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconCheck,
  IconFileImport,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { formatShortDate, formatSignedUsd } from "@/lib/format/money";

type DupStatus = "new" | "duplicate_in_file" | "duplicate_existing";

type PreviewRow = {
  id: string;
  date: string;
  amountCents: number;
  name: string;
  merchantName: string;
  category: string;
  dupStatus: DupStatus;
  dupTransactionId: string | null;
  decision: "import" | "skip";
};

type PreviewBatch = {
  id: string;
  filename: string;
  sourceLabel: string;
  parsedCount: number;
  newCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: PreviewRow[];
  invalid: { rawLine: string; reason: string }[];
};

type Stage = "pick" | "preview" | "done";

const DUP_LABEL: Record<DupStatus, string> = {
  new: "New",
  duplicate_in_file: "Duplicate in file",
  duplicate_existing: "Already in app",
};

function dupBadgeClass(status: DupStatus): string {
  if (status === "new") return "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]";
  return "bg-[#fff4ce] text-[#797673]";
}

export function ImportModal({
  beneficiaryId,
  variant = "toolbar",
  label = "Import",
  onImported,
}: {
  beneficiaryId: string | null;
  variant?: "toolbar" | "primary";
  label?: string;
  onImported?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("pick");
  const [depositsArePositive, setDepositsArePositive] = useState(true);
  const [sourceLabel, setSourceLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<PreviewBatch | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "import" | "skip">>({});
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setStage("pick");
    setBusy(false);
    setError(null);
    setBatch(null);
    setDecisions({});
    setResult(null);
    setSourceLabel("");
    setDepositsArePositive(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Let the close animation finish conceptually, then clear state.
    reset();
  }, [reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function onFile(file: File) {
    if (!beneficiaryId) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("beneficiaryId", beneficiaryId);
    fd.append("file", file);
    if (sourceLabel.trim()) fd.append("sourceLabel", sourceLabel.trim());
    // Let the server auto-detect columns; pass the sign convention the user
    // picked so single-amount files are interpreted correctly.
    fd.append("depositsArePositive", String(depositsArePositive));
    const res = await fetch("/api/imports/preview", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Could not read that file");
      return;
    }
    const b = (data as { batch: PreviewBatch }).batch;
    setBatch(b);
    setDecisions(Object.fromEntries(b.rows.map((r) => [r.id, r.decision])));
    setStage("preview");
  }

  function setRowDecision(id: string, decision: "import" | "skip") {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  }

  const counts = useMemo(() => {
    if (!batch) return { toImport: 0, toSkip: 0 };
    let toImport = 0;
    let toSkip = 0;
    for (const r of batch.rows) {
      if ((decisions[r.id] ?? r.decision) === "import") toImport++;
      else toSkip++;
    }
    return { toImport, toSkip };
  }, [batch, decisions]);

  async function commit() {
    if (!batch) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/imports/${batch.id}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Import failed");
      return;
    }
    setResult({
      imported: (data as { imported: number }).imported ?? 0,
      skipped: (data as { skipped: number }).skipped ?? 0,
    });
    setStage("done");
    router.refresh();
    onImported?.();
  }

  async function discard() {
    if (batch) {
      await fetch(`/api/imports/${batch.id}`, { method: "DELETE" }).catch(() => {});
    }
    close();
  }

  const triggerClass =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-sm bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
      : "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass} disabled={!beneficiaryId}>
        <IconFileImport size={16} stroke={1.5} aria-hidden />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-[var(--color-cs-border)] bg-[var(--color-cs-brand)] px-4 py-3.5 text-white">
              <h2 id="import-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                <IconFileImport size={18} stroke={1.8} aria-hidden />
                Import bank transactions
              </h2>
              <button type="button" onClick={close} aria-label="Close" className="rounded p-1 hover:bg-white/15">
                <IconX size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {error && (
                <p className="mb-3 flex items-start gap-1.5 rounded-sm bg-[var(--color-cs-danger-bg,#fde7e9)] px-3 py-2 text-xs text-[var(--color-cs-danger)]" role="alert">
                  <IconAlertTriangle size={14} stroke={1.8} aria-hidden className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              {stage === "pick" && (
                <div>
                  <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
                    Upload a CSV you exported from your bank. We&rsquo;ll match the columns, flag any
                    transactions that look like duplicates of ones already in the app, and let you review
                    before anything is saved.
                  </p>

                  <label className="mt-4 block text-[12px] font-medium text-[var(--color-cs-text)]">
                    Source name (optional)
                    <input
                      type="text"
                      value={sourceLabel}
                      onChange={(e) => setSourceLabel(e.target.value)}
                      placeholder="e.g. Chase checking"
                      className="mt-1 h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)]"
                    />
                  </label>

                  <fieldset className="mt-4">
                    <legend className="text-[12px] font-medium text-[var(--color-cs-text)]">
                      In your file, deposits (money in) are shown as&hellip;
                    </legend>
                    <div className="mt-1.5 flex flex-col gap-1.5 text-[13px] text-[var(--color-cs-text-secondary)]">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sign"
                          checked={depositsArePositive}
                          onChange={() => setDepositsArePositive(true)}
                        />
                        Positive numbers (e.g. <span className="tabular-nums">1,200.00</span>) — most common
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sign"
                          checked={!depositsArePositive}
                          onChange={() => setDepositsArePositive(false)}
                        />
                        Negative numbers (e.g. <span className="tabular-nums">-1,200.00</span>)
                      </label>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">
                      Files with separate &ldquo;debit&rdquo; and &ldquo;credit&rdquo; columns are detected automatically.
                    </p>
                  </fieldset>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void onFile(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy || !beneficiaryId}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-6 text-[13px] font-medium text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)] hover:text-[var(--color-cs-brand)] disabled:opacity-50"
                  >
                    <IconUpload size={18} stroke={1.6} aria-hidden />
                    {busy ? "Reading file…" : "Choose CSV file"}
                  </button>
                </div>
              )}

              {stage === "preview" && batch && (
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
                    <span className="rounded-full bg-[var(--color-cs-surface)] px-2.5 py-1 text-[var(--color-cs-text-secondary)]">
                      {batch.parsedCount} rows read
                    </span>
                    <span className="rounded-full bg-[var(--color-cs-success-bg)] px-2.5 py-1 text-[var(--color-cs-success)]">
                      {batch.newCount} new
                    </span>
                    <span className="rounded-full bg-[#fff4ce] px-2.5 py-1 text-[#797673]">
                      {batch.duplicateCount} possible duplicate{batch.duplicateCount === 1 ? "" : "s"}
                    </span>
                    {batch.invalidCount > 0 && (
                      <span className="rounded-full bg-[var(--color-cs-danger-bg,#fde7e9)] px-2.5 py-1 text-[var(--color-cs-danger)]">
                        {batch.invalidCount} skipped (unreadable)
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-[12px] text-[var(--color-cs-text-secondary)]">
                    Duplicates are unchecked by default. Review and adjust, then import.
                  </p>

                  <div className="overflow-hidden rounded border border-[var(--color-cs-border)]">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                          <th className="px-2 py-1.5 w-[44px]">Import</th>
                          <th className="px-2 py-1.5 w-[70px]">Date</th>
                          <th className="px-2 py-1.5">Description</th>
                          <th className="px-2 py-1.5 w-[96px]">Status</th>
                          <th className="px-2 py-1.5 text-right w-[92px]">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.rows.map((r) => {
                          const decision = decisions[r.id] ?? r.decision;
                          return (
                            <tr
                              key={r.id}
                              className={`border-b border-[var(--color-cs-border)] last:border-b-0 ${
                                decision === "skip" ? "opacity-55" : ""
                              }`}
                            >
                              <td className="px-2 py-1.5">
                                <input
                                  type="checkbox"
                                  checked={decision === "import"}
                                  onChange={(e) => setRowDecision(r.id, e.target.checked ? "import" : "skip")}
                                  aria-label={`Import ${r.name || "transaction"}`}
                                />
                              </td>
                              <td className="px-2 py-1.5 tabular-nums text-[var(--color-cs-text)]">
                                {formatShortDate(r.date)}
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="truncate font-medium text-[var(--color-cs-text)]">
                                  {r.name || "—"}
                                </div>
                                {(r.merchantName || r.category) && (
                                  <div className="truncate text-[10px] text-[var(--color-cs-text-muted)]">
                                    {[r.merchantName, r.category].filter(Boolean).join(" · ")}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-1.5">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${dupBadgeClass(r.dupStatus)}`}>
                                  {DUP_LABEL[r.dupStatus]}
                                </span>
                              </td>
                              <td
                                className={`px-2 py-1.5 text-right tabular-nums font-medium ${
                                  r.amountCents < 0
                                    ? "text-[var(--color-cs-success)]"
                                    : "text-[var(--color-cs-text)]"
                                }`}
                              >
                                {formatSignedUsd(r.amountCents)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {stage === "done" && result && (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]">
                    <IconCheck size={26} stroke={2} aria-hidden />
                  </div>
                  <p className="mt-3 text-[15px] font-semibold text-[var(--color-cs-text)]">
                    Imported {result.imported} transaction{result.imported === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
                    {result.skipped > 0 ? `${result.skipped} skipped. ` : ""}
                    They now appear in Money alongside your synced transactions, and count toward your limits.
                  </p>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3">
              {stage === "preview" && batch ? (
                <>
                  <button
                    type="button"
                    onClick={discard}
                    className="rounded-sm px-3 py-1.5 text-[13px] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => void commit()}
                    disabled={busy || counts.toImport === 0}
                    className="rounded-sm bg-[var(--color-cs-brand)] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
                  >
                    {busy ? "Importing…" : `Import ${counts.toImport} transaction${counts.toImport === 1 ? "" : "s"}`}
                  </button>
                </>
              ) : (
                <>
                  <span />
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-sm border border-[var(--color-cs-border)] bg-white px-3.5 py-1.5 text-[13px] text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
                  >
                    {stage === "done" ? "Done" : "Cancel"}
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
