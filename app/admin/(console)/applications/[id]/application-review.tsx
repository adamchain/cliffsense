"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedApplication } from "@/lib/applications/serialize";
import { relationshipLabel } from "@/lib/applications/labels";
import { ApplicationStatusBadge, ApplicationTimeline } from "@/components/applications/status-parts";

type Props = {
  application: SerializedApplication;
  applicant: { email: string; name: string };
};

const DOC_REVIEW_STYLE: Record<string, string> = {
  verified: "text-[#2f6d1a]",
  rejected: "text-[#a4262c]",
  pending: "text-[var(--color-cs-text-muted)]",
};

export function ApplicationReview({ application, applicant }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasVerified = application.documents.some((d) => d.reviewStatus === "verified");
  const decided = application.status !== "pending_review";

  async function reviewDoc(docId: string, reviewStatus: "verified" | "rejected" | "pending") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${application.id}/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not update document");
      return;
    }
    router.refresh();
  }

  async function decide(action: "approve" | "reject" | "request_info") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not update application");
      return;
    }
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium">{applicant.email || "Applicant"}</h1>
        <ApplicationStatusBadge status={application.status} />
      </div>

      {/* Applicant + acting-for */}
      <section className="rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px]">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Applicant</dt>
            <dd className="font-medium">{applicant.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Account type</dt>
            <dd className="font-medium">{application.accountType}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Helping</dt>
            <dd className="font-medium">{application.actingFor.personName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Authority</dt>
            <dd className="font-medium">{relationshipLabel(application.actingFor.relationship)}</dd>
          </div>
        </dl>
      </section>

      {/* Documents */}
      <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
        <h2 className="mb-2 text-[14px] font-semibold">Authorization documents</h2>
        {application.documents.length === 0 ? (
          <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
            No documents uploaded yet. Approval is blocked until a document is verified.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-cs-border)]">
            {application.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <a
                    href={`/api/applications/documents/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[13px] font-medium text-[var(--color-cs-brand)] hover:underline"
                  >
                    {d.filename}
                  </a>
                  <p className="text-[11px] text-[var(--color-cs-text-muted)]">
                    {d.label} · {(d.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-semibold ${DOC_REVIEW_STYLE[d.reviewStatus] ?? ""}`}>
                    {d.reviewStatus}
                  </span>
                  <button
                    type="button"
                    disabled={busy || d.reviewStatus === "verified"}
                    onClick={() => reviewDoc(d.id, "verified")}
                    className="rounded border border-[var(--color-cs-border)] px-2 py-1 text-[12px] font-medium hover:bg-[var(--color-cs-surface)] disabled:opacity-40"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy || d.reviewStatus === "rejected"}
                    onClick={() => reviewDoc(d.id, "rejected")}
                    className="rounded border border-[var(--color-cs-border)] px-2 py-1 text-[12px] font-medium hover:bg-[var(--color-cs-surface)] disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Decision */}
      <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
        <h2 className="mb-2 text-[14px] font-semibold">Decision</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note to the applicant (shown on their status page and emailed)."
          rows={2}
          className="w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2 py-1.5 text-[13px]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !hasVerified}
            onClick={() => decide("approve")}
            title={hasVerified ? "" : "Verify a document first"}
            className="rounded bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide("request_info")}
            className="rounded border border-[var(--color-cs-border)] px-3 py-1.5 text-[12px] font-semibold hover:bg-[var(--color-cs-surface)] disabled:opacity-40"
          >
            Request more info
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide("reject")}
            className="rounded border border-[var(--color-cs-danger)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-cs-danger)] hover:bg-[var(--color-cs-danger-bg)] disabled:opacity-40"
          >
            Reject
          </button>
        </div>
        {!hasVerified ? (
          <p className="mt-2 text-[12px] text-[var(--color-cs-text-muted)]">
            Approval is disabled until at least one document is verified.
          </p>
        ) : null}
        {decided ? (
          <p className="mt-2 text-[12px] text-[var(--color-cs-text-secondary)]">
            This application was already {application.status === "approved" ? "approved" : "rejected"}. You can
            still change the decision.
          </p>
        ) : null}
        {error ? <p className="mt-2 text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
      </section>

      {/* Timeline */}
      <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
        <h2 className="mb-3 text-[14px] font-semibold">Timeline</h2>
        <ApplicationTimeline events={application.timeline} />
      </section>
    </div>
  );
}
