"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { currentRuleSummary } from "@/lib/alerts/ten-part";
import type { ContinuityCaseView } from "@/lib/alerts/serialize-case";

type VaultDoc = { id: string; filename: string };

const METHODS = ["COMPASS", "SSA portal or app", "Phone", "Mail", "In person", "Other"];

export function ContinuityCasePanel({
  beneficiaryId,
  continuityCase,
  onUpdated,
}: {
  beneficiaryId: string;
  continuityCase: ContinuityCaseView;
  onUpdated: () => void;
}) {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState(METHODS[0] ?? "COMPASS");
  const [submittedAt, setSubmittedAt] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [ackNote, setAckNote] = useState("");
  const [appealDate, setAppealDate] = useState("");
  const [continuedDate, setContinuedDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/vault?beneficiaryId=${encodeURIComponent(beneficiaryId)}`)
      .then((res) => res.json())
      .then((data: { documents?: VaultDoc[] }) => {
        if (!cancelled) setDocs(data.documents ?? []);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [beneficiaryId]);

  const rule = currentRuleSummary(continuityCase.parts);
  const parts = continuityCase.parts;

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/cases/${continuityCase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update this case");
      return;
    }
    onUpdated();
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-cs-border)] bg-white/70 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        Case · {statusLabel(continuityCase.status)}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">{parts.whatChanged}</p>
      <p className={`mt-1 text-[12px] leading-snug ${rule.current ? "text-[var(--color-cs-text-muted)]" : "text-[var(--color-cs-danger)]"}`}>
        {rule.line}
      </p>

      <Field label="Why it matters" value={parts.whyItMatters} />
      <div className="mt-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          Each benefit
        </p>
        <ul className="mt-1 space-y-1">
          {parts.affectedBenefits.map((benefit) => (
            <li key={benefit.program} className="text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
              <span className="font-medium text-[var(--color-cs-text)]">{benefit.program}.</span> {benefit.analysis}
            </li>
          ))}
        </ul>
      </div>
      <Field
        label={`Deadline · ${parts.actionDate.confidence}`}
        value={`${parts.actionDate.label} ${parts.actionDate.source}`}
      />
      <Field label="Official channel" value={parts.officialChannel.note} />
      <Field label="If this benefit cannot continue" value={parts.alternativePathway} />
      <Field label="Proof to keep" value={parts.proofToRetain} />
      <Field label="Appeal and continued benefits" value={parts.cureAndAppeal.note} />

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          Documents
        </p>
        <ul className="mt-1 space-y-2">
          {continuityCase.evidence.map((slot) => (
            <li key={slot.key} className="text-[13px]">
              <label className="block text-[var(--color-cs-text-secondary)]">
                {slot.label}
                <select
                  className="cs-input mt-1"
                  value={slot.documentId ?? ""}
                  disabled={busy}
                  onChange={(event) =>
                    void send({
                      type: "link_evidence",
                      slotKey: slot.key,
                      documentId: event.target.value || null,
                    })
                  }
                >
                  <option value="">Not linked</option>
                  {docs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
        {docs.length === 0 && (
          <p className="mt-1 text-[12px] text-[var(--color-cs-text-muted)]">
            Upload the file in the <Link href="/vault" className="text-[var(--color-cs-brand)] hover:underline">Vault</Link> first.
          </p>
        )}
      </div>

      <ul className="mt-3 space-y-1 text-[13px] text-[var(--color-cs-text-secondary)]">
        {continuityCase.tasks.map((task) => (
          <li key={task.key}>
            {task.status === "done" ? "Done" : "Open"} — {task.title}
          </li>
        ))}
      </ul>

      {!continuityCase.submission && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              type: "record_submission",
              method,
              submittedAt,
              documentId: receiptId,
              note: submissionNote,
            });
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Submission
          </p>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            How it was sent
            <select className="cs-input mt-1" value={method} onChange={(event) => setMethod(event.target.value)}>
              {METHODS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            Date sent
            <input
              type="date"
              required
              className="cs-input mt-1"
              value={submittedAt}
              onChange={(event) => setSubmittedAt(event.target.value)}
            />
          </label>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            Receipt in the Vault
            <select
              required
              className="cs-input mt-1"
              value={receiptId}
              onChange={(event) => setReceiptId(event.target.value)}
            >
              <option value="">Choose a file</option>
              {docs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            Note
            <input
              className="cs-input mt-1"
              value={submissionNote}
              onChange={(event) => setSubmissionNote(event.target.value)}
            />
          </label>
          <button type="submit" className="cs-acard-btn cs-acard-btn-primary" disabled={busy}>
            Record submission
          </button>
        </form>
      )}

      {continuityCase.submission && !continuityCase.acknowledgment && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send({ type: "record_acknowledgment", note: ackNote });
          }}
        >
          <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
            Submitted {continuityCase.submission.submittedAt.slice(0, 10)} by {continuityCase.submission.method}.
            {continuityCase.followUp?.status === "open"
              ? ` Follow up by ${continuityCase.followUp.dueDate?.slice(0, 10) ?? "the date on this case"} if the agency has not confirmed receipt.`
              : ""}
          </p>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            What the agency said
            <input className="cs-input mt-1" value={ackNote} onChange={(event) => setAckNote(event.target.value)} />
          </label>
          <button type="submit" className="cs-acard-btn" disabled={busy}>
            Record agency acknowledgment
          </button>
        </form>
      )}

      {continuityCase.acknowledgment && (
        <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
          Agency acknowledgment recorded {continuityCase.acknowledgment.recordedAt.slice(0, 10)}.
          {continuityCase.acknowledgment.note ? ` ${continuityCase.acknowledgment.note}` : ""}
        </p>
      )}

      <form
        className="mt-3 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send({
            type: "set_appeal",
            appealDeadline: appealDate || null,
            continuedBenefitsDeadline: continuedDate || null,
          });
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          Dates from the notice
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            Appeal deadline
            <input type="date" className="cs-input mt-1" value={appealDate} onChange={(e) => setAppealDate(e.target.value)} />
          </label>
          <label className="block text-[13px] text-[var(--color-cs-text-secondary)]">
            Continued benefits deadline
            <input
              type="date"
              className="cs-input mt-1"
              value={continuedDate}
              onChange={(e) => setContinuedDate(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="cs-acard-btn" disabled={busy}>
          Save notice dates
        </button>
      </form>

      {error && <p className="mt-2 text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}

function statusLabel(status: ContinuityCaseView["status"]): string {
  if (status === "waiting_on_agency") return "Waiting on the agency";
  if (status === "closed") return "Closed";
  return "Open";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">{value}</p>
    </div>
  );
}
