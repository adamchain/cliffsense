"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DATE_CONFIDENCES,
  DATE_CONFIDENCE_LABEL,
  stageSummary,
  type DateConfidence,
} from "@/lib/reporting/obligations";

export type ObligationProgressModel = {
  deadlineId: string;
  beneficiaryId: string;
  confidence: DateConfidence;
  sourceNote: string;
  sourceDocumentId: string | null;
  preparedAt: string | null;
  submittedAt: string | null;
  proofDocumentId: string | null;
  acknowledgedAt: string | null;
  followUp: string;
  completedAt: string | null;
};

type VaultDoc = { id: string; filename: string };

/**
 * Track one obligation from preparation to agency acknowledgment. Updates apply
 * to this obligation only — never to the program's renewal or another report.
 */
export function ObligationProgress({ initial }: { initial: ObligationProgressModel }) {
  const router = useRouter();
  const [m, setM] = useState(initial);
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState(initial.followUp);
  const [sourceNote, setSourceNote] = useState(initial.sourceNote);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/vault?beneficiaryId=${encodeURIComponent(m.beneficiaryId)}`);
      const j = (await res.json().catch(() => ({}))) as { documents?: VaultDoc[] };
      if (!cancelled) setDocs(j.documents ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [m.beneficiaryId]);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/reporting-deadlines/${m.deadlineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as {
      deadline?: Record<string, unknown>;
      error?: string;
    };
    if (!res.ok || !j.deadline) {
      setError(j.error ?? "Could not save");
      return;
    }
    const d = j.deadline;
    const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : null);
    setM((prev) => ({
      ...prev,
      preparedAt: iso(d.preparedAt),
      submittedAt: iso(d.submittedAt),
      acknowledgedAt: iso(d.acknowledgedAt),
      completedAt: iso(d.completedAt),
      proofDocumentId: (d.proofDocumentId as string | null) ?? null,
      followUp: String(d.followUp ?? ""),
      confidence: (d.confidence as DateConfidence) ?? prev.confidence,
      sourceNote: String(d.sourceNote ?? ""),
      sourceDocumentId:
        "sourceDocumentId" in body ? ((body.sourceDocumentId as string | null) ?? null) : prev.sourceDocumentId,
    }));
    router.refresh();
  }

  const checks: { key: "prepared" | "submitted" | "acknowledged"; label: string; on: boolean }[] = [
    { key: "prepared", label: "Prepared", on: Boolean(m.preparedAt) },
    { key: "submitted", label: "Submitted to the agency", on: Boolean(m.submittedAt) },
    { key: "acknowledged", label: "Agency acknowledged receipt", on: Boolean(m.acknowledgedAt) },
  ];

  const label = "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]";

  return (
    <div className="mt-4 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold text-[var(--color-cs-text)]">Progress</h2>
        <span className="text-[12.5px] text-[var(--color-cs-text-secondary)]">
          {m.completedAt ? "Complete" : stageSummary(m)}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
        This tracks this one obligation. Finishing it does not mark the renewal or any other report
        done.
      </p>

      <div className="mt-3 space-y-2">
        {checks.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-[14px] text-[var(--color-cs-text)]">
            <input
              type="checkbox"
              checked={c.on}
              onChange={(e) => void patch({ [c.key]: e.target.checked })}
            />
            {c.label}
          </label>
        ))}
      </div>

      <div className="mt-4">
        <div className={label}>Proof of submission</div>
        <select
          className="cs-input mt-1"
          value={m.proofDocumentId ?? ""}
          onChange={(e) => void patch({ proofDocumentId: e.target.value || null })}
        >
          <option value="">Not saved yet</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.filename}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
          Upload a confirmation page, receipt, or fax log to the{" "}
          <Link href="/vault" className="text-[var(--color-cs-brand)]">
            Vault
          </Link>
          , then pick it here.
        </p>
      </div>

      <div className="mt-4">
        <div className={label}>Unresolved follow-up</div>
        <textarea
          className="cs-input mt-1 min-h-[64px]"
          maxLength={1000}
          placeholder="e.g. Caseworker said to expect a call by 11/3"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          onBlur={() => followUp !== m.followUp && void patch({ followUp })}
        />
      </div>

      <div className="mt-4 border-t border-[var(--color-cs-sep)] pt-3">
        <div className={label}>Date source</div>
        <select
          className="cs-input mt-1"
          value={m.confidence}
          onChange={(e) => void patch({ confidence: e.target.value })}
        >
          {DATE_CONFIDENCES.map((c) => (
            <option key={c} value={c}>
              {DATE_CONFIDENCE_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          className="cs-input mt-2"
          aria-label="Source notice in the Vault"
          value={m.sourceDocumentId ?? ""}
          onChange={(e) => void patch({ sourceDocumentId: e.target.value || null })}
        >
          <option value="">No notice attached</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              Notice: {d.filename}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="cs-input mt-2"
          maxLength={500}
          placeholder="Notice name and date, e.g. PA 600 dated 9/14"
          value={sourceNote}
          onChange={(e) => setSourceNote(e.target.value)}
          onBlur={() => sourceNote !== m.sourceNote && void patch({ sourceNote })}
        />
        {m.sourceDocumentId && (
          <a
            href={`/api/vault/${m.sourceDocumentId}?download=1`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-cs-brand)]"
          >
            Open the source notice
          </a>
        )}
      </div>

      {error && <p className="mt-2 text-[12px] text-[var(--color-cs-danger)]">{error}</p>}

      <button
        type="button"
        className="cs-btn cs-btn-primary mt-4 w-full justify-center"
        onClick={() => void patch({ completed: !m.completedAt })}
      >
        {m.completedAt ? "Reopen" : "Mark this obligation complete"}
      </button>
    </div>
  );
}
