"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  centsToDollarInput,
  parseDollarsToCents,
  paymentProofLabel,
  SNT_PAYMENT_LABEL,
  SNT_PAYMENT_STATUSES,
  SNT_REVIEW_LABEL,
  SNT_REVIEW_STATUSES,
  type SntDisbursementView,
  type SntPaymentStatus,
  type SntProfileView,
  type SntReviewStatus,
} from "@/lib/snt/record";
import { formatPlainUsdFromCents } from "@/lib/format/money";

type EvidenceFile = { id: string; filename: string };

type Draft = {
  id: string | null;
  trustName: string;
  trusteeName: string;
  financialInstitution: string;
  paymentDate: string;
  amount: string;
  payee: string;
  purpose: string;
  status: SntPaymentStatus;
  reviewStatus: SntReviewStatus;
  proofNote: string;
  documentIds: string[];
  followUpDate: string;
};

function blankDraft(profile: SntProfileView): Draft {
  return {
    id: null,
    trustName: profile.trustName,
    trusteeName: profile.trusteeName,
    financialInstitution: profile.financialInstitution,
    paymentDate: "",
    amount: "",
    payee: "",
    purpose: "",
    status: "requested",
    reviewStatus: "none",
    proofNote: "",
    documentIds: [],
    followUpDate: "",
  };
}

function draftFromRow(row: SntDisbursementView): Draft {
  return {
    id: row.id,
    trustName: row.trustName,
    trusteeName: row.trusteeName,
    financialInstitution: row.financialInstitution,
    paymentDate: row.paymentDate ?? "",
    amount: centsToDollarInput(row.amountCents),
    payee: row.payee,
    purpose: row.purpose,
    status: row.status,
    reviewStatus: row.reviewStatus,
    proofNote: row.proofNote,
    documentIds: row.documentIds,
    followUpDate: row.followUpDate ?? "",
  };
}

function payload(beneficiaryId: string, draft: Draft) {
  const amountCents = parseDollarsToCents(draft.amount);
  return {
    ok: amountCents != null && draft.payee.trim() && draft.purpose.trim(),
    body: {
      beneficiaryId,
      trustName: draft.trustName.trim(),
      trusteeName: draft.trusteeName.trim(),
      financialInstitution: draft.financialInstitution.trim(),
      paymentDate: draft.paymentDate || null,
      amountCents: amountCents ?? 0,
      payee: draft.payee.trim(),
      purpose: draft.purpose.trim(),
      status: draft.status,
      reviewStatus: draft.reviewStatus,
      proofNote: draft.proofNote.trim(),
      documentIds: draft.documentIds,
      followUpDate: draft.followUpDate || null,
    },
  };
}

export function SntRegister({
  beneficiaryId,
  canWrite,
  profile,
  disbursements,
  evidence,
}: {
  beneficiaryId: string;
  canWrite: boolean;
  profile: SntProfileView;
  disbursements: SntDisbursementView[];
  evidence: EvidenceFile[];
}) {
  const router = useRouter();
  const [trust, setTrust] = useState(profile);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/snt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, ...trust }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError("Could not save the trust profile.");
      return;
    }
    router.refresh();
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const next = payload(beneficiaryId, draft);
    if (!next.ok) {
      setError("Enter an amount, who was paid or would be paid, and the purpose.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(draft.id ? `/api/snt/${draft.id}` : "/api/snt", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.id ? { ...next.body, beneficiaryId: undefined } : next.body),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save that disbursement.");
      return;
    }
    setDraft(null);
    router.refresh();
  }

  async function remove(id: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/snt/${id}`, { method: "DELETE" }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError("Could not delete that disbursement.");
      return;
    }
    setConfirmDelete(null);
    if (draft?.id === id) setDraft(null);
    router.refresh();
  }

  return (
    <div id="snt" className="mb-4 scroll-mt-20 rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-4">
      <h3 className="text-[15px] font-semibold text-[var(--color-cs-text)]">Disbursement register</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Payment request, then trustee approval, then payment, then supporting proof, then a benefit review when one is
        needed. A request or approval is not a payment. Bene-Watch does not move trust funds or decide eligibility.
      </p>

      <form onSubmit={saveProfile} className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block text-[12px] font-semibold text-[var(--color-cs-text)]">
          Trust
          <input
            className="cs-input mt-1"
            value={trust.trustName}
            disabled={!canWrite}
            onChange={(e) => setTrust((row) => ({ ...row, trustName: e.target.value }))}
          />
        </label>
        <label className="block text-[12px] font-semibold text-[var(--color-cs-text)]">
          Legal trustee
          <input
            className="cs-input mt-1"
            value={trust.trusteeName}
            disabled={!canWrite}
            onChange={(e) => setTrust((row) => ({ ...row, trusteeName: e.target.value }))}
          />
        </label>
        <label className="block text-[12px] font-semibold text-[var(--color-cs-text)]">
          Trustee contact
          <input
            className="cs-input mt-1"
            value={trust.trusteeContact}
            disabled={!canWrite}
            onChange={(e) => setTrust((row) => ({ ...row, trusteeContact: e.target.value }))}
          />
        </label>
        <label className="block text-[12px] font-semibold text-[var(--color-cs-text)]">
          Financial institution
          <input
            className="cs-input mt-1"
            value={trust.financialInstitution}
            disabled={!canWrite}
            onChange={(e) => setTrust((row) => ({ ...row, financialInstitution: e.target.value }))}
          />
        </label>
        {canWrite ? (
          <div className="sm:col-span-2">
            <button type="submit" className="cs-btn cs-btn-secondary" disabled={saving}>
              Save trust profile
            </button>
          </div>
        ) : (
          <p className="sm:col-span-2 text-[12px] text-[var(--color-cs-text-secondary)]">
            You can view this register. Editing requires manager access on the case.
          </p>
        )}
      </form>

      <ul className="mt-4 space-y-2">
        {disbursements.length === 0 ? (
          <li className="text-[13px] text-[var(--color-cs-text-secondary)]">No disbursements recorded yet.</li>
        ) : (
          disbursements.map((row) => (
            <li key={row.id} className="rounded-lg border border-[var(--color-cs-border)] bg-white px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-[14px] font-semibold text-[var(--color-cs-text)]">
                  {formatPlainUsdFromCents(row.amountCents)} · {row.payee}
                </div>
                <div className="text-[12px] text-[var(--color-cs-text-secondary)]">{row.paymentDate ?? "No date"}</div>
              </div>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">{row.purpose}</p>
              <p className="mt-1 text-[12px] font-medium text-[var(--color-cs-text)]">
                {SNT_PAYMENT_LABEL[row.status]} · {paymentProofLabel(row.status, row.proofNote, row.documentIds)}
                {row.reviewStatus !== "none" ? ` · ${SNT_REVIEW_LABEL[row.reviewStatus]}` : ""}
              </p>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-muted)]">
                {[row.trustName, row.trusteeName, row.financialInstitution].filter(Boolean).join(" · ") || "Trust profile not on this row"}
                {row.followUpDate ? ` · Follow-up ${row.followUpDate}` : ""}
              </p>
              {canWrite ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-[12.5px] font-semibold text-[var(--color-cs-brand)]"
                    onClick={() => {
                      setError(null);
                      setDraft(draftFromRow(row));
                    }}
                  >
                    Edit
                  </button>
                  {confirmDelete === row.id ? (
                    <button
                      type="button"
                      className="text-[12.5px] font-semibold text-[var(--color-cs-danger)]"
                      disabled={saving}
                      onClick={() => remove(row.id)}
                    >
                      Confirm delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-[12.5px] font-semibold text-[var(--color-cs-text-secondary)]"
                      onClick={() => setConfirmDelete(row.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      {canWrite && !draft ? (
        <button
          type="button"
          className="cs-btn cs-btn-primary mt-3"
          onClick={() => {
            setError(null);
            setDraft(blankDraft(trust));
          }}
        >
          Add a disbursement
        </button>
      ) : null}

      {draft ? (
        <form onSubmit={saveDraft} className="mt-3 grid gap-2 rounded-lg border border-[var(--color-cs-border)] bg-white p-3 sm:grid-cols-2">
          <label className="block text-[12px] font-semibold">
            Trust on this record
            <input className="cs-input mt-1" value={draft.trustName} onChange={(e) => setDraft({ ...draft, trustName: e.target.value })} />
          </label>
          <label className="block text-[12px] font-semibold">
            Legal trustee
            <input className="cs-input mt-1" value={draft.trusteeName} onChange={(e) => setDraft({ ...draft, trusteeName: e.target.value })} />
          </label>
          <label className="block text-[12px] font-semibold sm:col-span-2">
            Financial institution
            <input
              className="cs-input mt-1"
              value={draft.financialInstitution}
              onChange={(e) => setDraft({ ...draft, financialInstitution: e.target.value })}
            />
          </label>
          <label className="block text-[12px] font-semibold">
            Date
            <input className="cs-input mt-1" type="date" value={draft.paymentDate} onChange={(e) => setDraft({ ...draft, paymentDate: e.target.value })} />
          </label>
          <label className="block text-[12px] font-semibold">
            Amount
            <input className="cs-input mt-1" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" />
          </label>
          <label className="block text-[12px] font-semibold">
            Payee
            <input className="cs-input mt-1" value={draft.payee} onChange={(e) => setDraft({ ...draft, payee: e.target.value })} />
          </label>
          <label className="block text-[12px] font-semibold">
            Status
            <select className="cs-input mt-1" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SntPaymentStatus })}>
              {SNT_PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SNT_PAYMENT_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-semibold sm:col-span-2">
            Purpose
            <textarea
              className="mt-1 w-full rounded-[14px] border border-[var(--color-cs-input-border)] px-4 py-2 text-[15px]"
              rows={2}
              value={draft.purpose}
              onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
            />
          </label>
          <label className="block text-[12px] font-semibold">
            Benefit review
            <select
              className="cs-input mt-1"
              value={draft.reviewStatus}
              onChange={(e) => setDraft({ ...draft, reviewStatus: e.target.value as SntReviewStatus })}
            >
              {SNT_REVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SNT_REVIEW_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-semibold">
            Follow-up date
            <input className="cs-input mt-1" type="date" value={draft.followUpDate} onChange={(e) => setDraft({ ...draft, followUpDate: e.target.value })} />
          </label>
          <label className="block text-[12px] font-semibold sm:col-span-2">
            Proof note
            <input
              className="cs-input mt-1"
              value={draft.proofNote}
              onChange={(e) => setDraft({ ...draft, proofNote: e.target.value })}
              placeholder="What document shows this, if it is not uploaded yet"
            />
          </label>
          {evidence.length > 0 ? (
            <fieldset className="sm:col-span-2">
              <legend className="text-[12px] font-semibold">Files already in this folder</legend>
              <div className="mt-1 max-h-28 space-y-1 overflow-auto">
                {evidence.map((file) => (
                  <label key={file.id} className="flex items-center gap-2 text-[12.5px]">
                    <input
                      type="checkbox"
                      checked={draft.documentIds.includes(file.id)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          documentIds: e.target.checked
                            ? [...draft.documentIds, file.id]
                            : draft.documentIds.filter((id) => id !== file.id),
                        })
                      }
                    />
                    <span className="truncate">{file.filename}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="sm:col-span-2 text-[12px] text-[var(--color-cs-text-secondary)]">
              Upload invoices, approvals, and confirmations on the rows below, then attach them here.
            </p>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="cs-btn cs-btn-primary" disabled={saving}>
              {draft.id ? "Save changes" : "Save disbursement"}
            </button>
            <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-[12.5px] text-[var(--color-cs-danger)]">{error}</p> : null}
    </div>
  );
}
