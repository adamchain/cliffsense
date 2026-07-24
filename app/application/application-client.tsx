"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconCheck, IconClock, IconAlertTriangle, IconUpload, IconRefresh } from "@tabler/icons-react";
import type { SerializedApplication } from "@/lib/applications/serialize";
import { DOC_TYPE_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/applications/labels";
import { ApplicationStatusBadge, ApplicationTimeline } from "@/components/applications/status-parts";

const DOC_REVIEW_STYLE: Record<string, string> = {
  verified: "text-[#2f6d1a]",
  rejected: "text-[#a4262c]",
  pending: "text-[var(--color-cs-text-muted)]",
};

export function ApplicationClient({ initial }: { initial: SerializedApplication }) {
  const router = useRouter();
  const { update } = useSession();
  const [app, setApp] = useState(initial);
  const [personName, setPersonName] = useState(initial.actingFor.personName);
  const [relationship, setRelationship] = useState(initial.actingFor.relationship || "representative_payee");
  const [docType, setDocType] = useState<string>(DOC_TYPE_OPTIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshAndLeave = useCallback(async () => {
    // Pull the fresh applicationStatus into the JWT, then let middleware route
    // the now-approved user into onboarding.
    await update({ action: "refreshApplication" });
    router.replace("/");
    router.refresh();
  }, [update, router]);

  useEffect(() => {
    if (initial.status === "approved") void refreshAndLeave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload(): Promise<SerializedApplication | null> {
    const res = await fetch("/api/applications", { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as { application: SerializedApplication | null };
    if (j.application) setApp(j.application);
    return j.application;
  }

  async function checkForUpdates() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const fresh = await reload();
    setBusy(false);
    if (fresh?.status === "approved") {
      void refreshAndLeave();
    } else {
      setNotice("Status is still under review. We'll email you when there's a decision.");
    }
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personName, relationship }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not save");
      return;
    }
    const j = (await res.json()) as { application: SerializedApplication };
    setApp(j.application);
    setNotice("Saved. Now upload one authorization document below.");
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const fd = new FormData();
    fd.append("docType", docType);
    fd.append("file", file);
    const res = await fetch("/api/applications/documents", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Upload failed");
      return;
    }
    await reload();
    setNotice("Document uploaded and sent for review.");
  }

  const rejected = app.status === "rejected";
  const canEdit = app.status === "pending_review" || rejected;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14">
        <Image
          src="/mybenefitspa-logo.png"
          alt="MyBenefitsPA"
          width={180}
          height={142}
          priority
          className="h-8 w-auto"
        />

        <div className="mt-8 flex items-center gap-3">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">Your application</h1>
          <ApplicationStatusBadge status={app.status} />
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          {app.status === "approved"
            ? "You're approved — taking you to setup…"
            : rejected
              ? "We couldn't approve your application yet. See the note below — you can upload a different document and we'll take another look."
              : "Because you're helping manage benefits for someone else, our team reviews your application before granting access. Tell us who you're helping and upload one authorization document."}
        </p>

        {app.reviewNote ? (
          <div
            className={`mt-4 flex gap-2 rounded-xl border p-3 text-[13px] ${
              rejected
                ? "border-[#f0c9cb] bg-[#fbe7e8] text-[#7d1d22]"
                : "border-[#f0dcae] bg-[#fff2dc] text-[#7a4f10]"
            }`}
          >
            <IconAlertTriangle size={18} stroke={1.8} className="mt-0.5 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">A note from our reviewer: </span>
              {app.reviewNote}
            </p>
          </div>
        ) : null}

        {canEdit ? (
          <>
            {/* Who you're helping */}
            <form onSubmit={saveDetails} className="cs-card mt-6 space-y-5 p-6">
              <h2 className="text-[15px] font-bold">Who are you helping?</h2>
              <div className="flex flex-col gap-1.5">
                <label className="cs-label" htmlFor="pn">
                  Their full name
                </label>
                <input
                  id="pn"
                  required
                  value={personName}
                  onChange={(ev) => setPersonName(ev.target.value)}
                  className="cs-input"
                  placeholder="The person whose benefits you'll manage"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="cs-label" htmlFor="rel">
                  Your authority to act for them
                </label>
                <select
                  id="rel"
                  value={relationship}
                  onChange={(ev) => setRelationship(ev.target.value)}
                  className="cs-input"
                >
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={busy} className="cs-btn cs-btn-primary">
                  {busy ? "Saving…" : "Save details"}
                </button>
              </div>
            </form>

            {/* Document upload */}
            <div className="cs-card mt-4 space-y-4 p-6">
              <div>
                <h2 className="text-[15px] font-bold">Authorization document</h2>
                <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
                  Upload one of the following (PDF or image, up to 10&nbsp;MB). An admin verifies it before
                  approving your application.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="cs-label" htmlFor="dt">
                    Document type
                  </label>
                  <select id="dt" value={docType} onChange={(ev) => setDocType(ev.target.value)} className="cs-input">
                    {DOC_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="cs-btn cs-btn-secondary inline-flex cursor-pointer items-center gap-1.5">
                  <IconUpload size={15} stroke={1.8} aria-hidden />
                  Choose file
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    disabled={busy}
                    onChange={uploadDoc}
                  />
                </label>
              </div>

              {app.documents.length > 0 ? (
                <ul className="divide-y divide-[var(--color-cs-border)] border-t border-[var(--color-cs-border)]">
                  {app.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{d.filename}</p>
                        <p className="text-[11px] text-[var(--color-cs-text-muted)]">{d.label}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[12px] font-semibold ${
                          DOC_REVIEW_STYLE[d.reviewStatus] ?? ""
                        }`}
                      >
                        {d.reviewStatus === "verified" ? (
                          <IconCheck size={14} stroke={2.2} aria-hidden />
                        ) : (
                          <IconClock size={14} stroke={1.8} aria-hidden />
                        )}
                        {d.reviewStatus === "verified"
                          ? "Verified"
                          : d.reviewStatus === "rejected"
                            ? "Rejected"
                            : "Pending review"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[var(--color-cs-text-muted)]">No documents uploaded yet.</p>
              )}
            </div>
          </>
        ) : null}

        {error ? <p className="mt-4 text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
        {notice ? <p className="mt-4 text-[13px] text-[var(--color-cs-text-secondary)]">{notice}</p> : null}

        {/* Timeline */}
        <div className="cs-card mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Progress</h2>
            <button
              type="button"
              onClick={checkForUpdates}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
            >
              <IconRefresh size={14} stroke={1.9} aria-hidden />
              Check for updates
            </button>
          </div>
          <ApplicationTimeline events={app.timeline} />
        </div>
      </main>
    </div>
  );
}
