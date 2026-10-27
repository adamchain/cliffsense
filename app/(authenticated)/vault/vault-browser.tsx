"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconArrowUp,
  IconChevronLeft,
  IconCircleCheck,
  IconInbox,
  IconLayoutGrid,
  IconList,
  IconSearch,
} from "@tabler/icons-react";
import { SntRegister } from "@/components/vault/snt-register";
import type { SntDisbursementView, SntProfileView } from "@/lib/snt/record";
import { VaultDocumentRow, VaultFileCard } from "./document-row";
import { VaultAddFile } from "./vault-upload";

export type VaultDocView = {
  id: string;
  filename: string;
  sizeLabel: string;
  uploadedLabel: string;
  slotId: string | null;
  kind: "docx" | "file";
  preview: string | null;
};

export type VaultSlotView = {
  id: string;
  label: string;
  hint: string;
  attention: "needed" | "review" | "optional" | "keep";
};

export type VaultFolderView = {
  id: string;
  label: string;
  hint: string;
  tint: string;
  slots: VaultSlotView[];
  docs: VaultDocView[];
};

function FolderIcon({ tint, className }: { tint: string; className?: string }) {
  return (
    <svg viewBox="0 0 96 80" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 14h18.2c1.7 0 3.2.8 4.2 2.1L42 22H16c-2.2 0-4-1.8-4-4s1.8-4 4-4z"
        fill={tint}
        opacity="0.55"
      />
      <path
        d="M8 22c0-4.4 3.6-8 8-8h18.2c2.5 0 4.8 1.2 6.2 3.2L44 22h36c4.4 0 8 3.6 8 8v34c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V22z"
        fill={tint}
      />
      <path
        d="M12 34c0-3.3 2.7-6 6-6h60c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6H18c-3.3 0-6-2.7-6-6V34z"
        fill={tint}
        opacity="0.82"
      />
    </svg>
  );
}

function attentionRank(attention: VaultSlotView["attention"], filed: boolean): number {
  if (filed) return 2;
  if (attention === "needed") return 0;
  if (attention === "review") return 1;
  if (attention === "keep") return 3;
  return 4;
}

function StatusMark({ attention, filed }: { attention: VaultSlotView["attention"]; filed: boolean }) {
  if (filed) {
    return <IconCircleCheck size={18} stroke={1.8} className="text-[var(--color-cs-success)]" aria-hidden />;
  }
  if (attention === "needed") {
    return <IconAlertCircle size={18} stroke={1.8} className="text-[var(--color-cs-warning)]" aria-hidden />;
  }
  if (attention === "keep") {
    return <IconInbox size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" aria-hidden />;
  }
  return <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-cs-fill)]" aria-hidden />;
}

function statusLabel(attention: VaultSlotView["attention"], filed: boolean): string {
  if (filed) return "On file";
  if (attention === "needed") return "Missing proof";
  if (attention === "review") return "Confirm if this applies";
  if (attention === "keep") return "File here as they arrive";
  return "Add if this applies";
}

export function VaultBrowser({
  beneficiaryId,
  folders,
  proofFiled,
  proofNeeded,
  screened,
  canWrite,
  sntProfile,
  sntDisbursements,
}: {
  beneficiaryId: string;
  folders: VaultFolderView[];
  proofFiled: number;
  proofNeeded: number;
  screened: boolean;
  canWrite: boolean;
  sntProfile: SntProfileView;
  sntDisbursements: SntDisbursementView[];
}) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [scope, setScope] = useState<"case" | "all">(screened ? "case" : "all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === "#snt") {
        setScope("all");
        setOpenId("snt_able");
      }
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  useEffect(() => {
    if (openId !== "snt_able" || window.location.hash !== "#snt") return;
    document.getElementById("snt")?.scrollIntoView({ block: "start" });
  }, [openId]);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return folders
      .map((folder) => {
        const slots = folder.slots.filter((slot) => {
          const filed = folder.docs.some((doc) => doc.slotId === slot.id);
          const matchesQuery =
            !q ||
            slot.label.toLowerCase().includes(q) ||
            slot.hint.toLowerCase().includes(q) ||
            folder.label.toLowerCase().includes(q);
          if (!matchesQuery) return false;
          if (q || scope === "all" || filed) return true;
          return slot.attention !== "optional";
        });
        const folderMatches = !q || folder.label.toLowerCase().includes(q) || folder.hint.toLowerCase().includes(q);
        const loose = folder.docs.filter((doc) => !doc.slotId || !folder.slots.some((slot) => slot.id === doc.slotId));
        const showLoose = loose.length > 0 && (!q || folderMatches);
        const include =
          slots.length > 0 ||
          showLoose ||
          (scope === "all" && folderMatches) ||
          (folder.id === "other" && (scope === "all" || loose.length > 0));
        return { folder, slots, loose: showLoose ? loose : [], include };
      })
      .filter((row) => row.include);
  }, [folders, q, scope]);

  const open = visible.find((row) => row.folder.id === openId) ?? null;
  const pct = proofNeeded === 0 ? 0 : Math.round((proofFiled / proofNeeded) * 100);

  function renderSlots(folder: VaultFolderView, slots: VaultSlotView[], loose: VaultDocView[]) {
    const ordered = [...slots].sort((a, b) => {
      const aFiled = folder.docs.some((doc) => doc.slotId === a.id);
      const bFiled = folder.docs.some((doc) => doc.slotId === b.id);
      return attentionRank(a.attention, aFiled) - attentionRank(b.attention, bFiled);
    });

    return (
      <div>
        {folder.id === "snt_able" ? (
          <SntRegister
            beneficiaryId={beneficiaryId}
            canWrite={canWrite}
            profile={sntProfile}
            disbursements={sntDisbursements}
            evidence={folder.docs.map((doc) => ({ id: doc.id, filename: doc.filename }))}
          />
        ) : null}
        {ordered.length === 0 && loose.length === 0 ? (
          <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
            {folder.id === "other" ? "Nothing filed here yet." : "No matching documents in this folder."}
          </p>
        ) : null}
        <ul className="divide-y divide-[var(--color-cs-sep)]">
          {ordered.map((slot) => {
            const docs = folder.docs.filter((doc) => doc.slotId === slot.id);
            const filed = docs.length > 0;
            return (
              <li key={slot.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5">
                  <StatusMark attention={slot.attention} filed={filed} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-semibold text-[var(--color-cs-text)]">{slot.label}</span>
                    <span
                      className={`text-[12px] ${
                        !filed && slot.attention === "needed"
                          ? "font-semibold text-[var(--color-cs-warning)]"
                          : "text-[var(--color-cs-text-secondary)]"
                      }`}
                    >
                      {statusLabel(slot.attention, filed)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
                    {slot.hint}
                  </p>
                  {docs.length > 0 &&
                    (view === "cards" ? (
                      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {docs.map((doc) => (
                          <VaultFileCard
                            key={doc.id}
                            id={doc.id}
                            filename={doc.filename}
                            sizeLabel={doc.sizeLabel}
                            uploadedLabel={doc.uploadedLabel}
                            docx={doc.kind === "docx"}
                            preview={doc.preview}
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {docs.map((doc) => (
                          <VaultDocumentRow
                            key={doc.id}
                            id={doc.id}
                            filename={doc.filename}
                            sizeLabel={doc.sizeLabel}
                            uploadedLabel={doc.uploadedLabel}
                            docx={doc.kind === "docx"}
                            preview={doc.preview}
                          />
                        ))}
                      </ul>
                    ))}
                </div>
                <VaultAddFile
                  beneficiaryId={beneficiaryId}
                  category={folder.id}
                  slot={slot.id}
                  label={filed ? "Add another" : "Add"}
                  documentLabel={slot.label}
                />
              </li>
            );
          })}
        </ul>
        {(loose.length > 0 || folder.id === "other") && (
          <div className={ordered.length > 0 ? "mt-3 border-t border-[var(--color-cs-sep)] pt-3" : ""}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[13px] font-semibold text-[var(--color-cs-text)]">
                {folder.id === "other" ? "Files" : "Other files in this folder"}
              </div>
              <VaultAddFile beneficiaryId={beneficiaryId} category={folder.id} label="Add" />
            </div>
            {loose.length === 0 ? (
              <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No extra files.</p>
            ) : view === "cards" ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {loose.map((doc) => (
                  <VaultFileCard
                    key={doc.id}
                    id={doc.id}
                    filename={doc.filename}
                    sizeLabel={doc.sizeLabel}
                    uploadedLabel={doc.uploadedLabel}
                    docx={doc.kind === "docx"}
                    preview={doc.preview}
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {loose.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    id={doc.id}
                    filename={doc.filename}
                    sizeLabel={doc.sizeLabel}
                    uploadedLabel={doc.uploadedLabel}
                    docx={doc.kind === "docx"}
                    preview={doc.preview}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const itemCount = open ? open.slots.length + open.loose.length : visible.length;
  const navBtn =
    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium";

  function openFolder(id: string) {
    setOpenId(id);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-1.5 border-b border-[var(--color-cs-sep)] px-2 py-2 sm:px-3">
        <button
          type="button"
          className="cs-circbtn !h-8 !w-8 disabled:opacity-40"
          aria-label="Back"
          disabled={!open}
          onClick={() => setOpenId(null)}
        >
          <IconChevronLeft size={16} stroke={2.2} />
        </button>
        <button
          type="button"
          className="cs-circbtn !h-8 !w-8 disabled:opacity-40"
          aria-label="Up to Vault"
          disabled={!open}
          onClick={() => setOpenId(null)}
        >
          <IconArrowUp size={16} stroke={2.2} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-lg bg-[var(--color-cs-surface)] px-3 py-1.5 text-[13px]">
          <button
            type="button"
            onClick={() => setOpenId(null)}
            className="shrink-0 font-semibold text-[var(--color-cs-brand)]"
          >
            Vault
          </button>
          {open ? (
            <>
              <span className="text-[var(--color-cs-text-muted)]" aria-hidden>
                ›
              </span>
              <span className="truncate font-medium text-[var(--color-cs-text)]">{open.folder.label}</span>
            </>
          ) : (
            <span className="truncate text-[var(--color-cs-text-secondary)]">
              {scope === "case" ? "This case" : "All document types"}
            </span>
          )}
        </div>
        <label className="cs-search hidden !h-9 !w-52 !rounded-lg !px-3 sm:flex">
          <IconSearch size={16} stroke={1.8} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Find a document"
          />
        </label>
        <div className="inline-flex rounded-lg bg-[var(--color-cs-fill)] p-0.5" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`rounded-md p-1.5 ${
              view === "cards"
                ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
            aria-pressed={view === "cards"}
            aria-label="Icons"
            title="Icons"
          >
            <IconLayoutGrid size={16} stroke={2} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 ${
              view === "list"
                ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
            aria-pressed={view === "list"}
            aria-label="Details"
            title="Details"
          >
            <IconList size={16} stroke={2} />
          </button>
        </div>
      </div>

      <label className="cs-search !h-10 !rounded-none border-b border-[var(--color-cs-sep)] sm:hidden">
        <IconSearch size={16} stroke={1.8} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Vault"
          aria-label="Find a document"
        />
      </label>

      <div className="flex min-h-[28rem]">
        <nav className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] py-2 md:flex" aria-label="Folders">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Vault
          </div>
          <div className="px-1.5">
            <button
              type="button"
              onClick={() => {
                setScope("case");
                setOpenId(null);
              }}
              className={`${navBtn} ${
                scope === "case" && !open
                  ? "bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                  : "text-[var(--color-cs-text)] hover:bg-white/70"
              }`}
              aria-pressed={scope === "case"}
            >
              This case
            </button>
            <button
              type="button"
              onClick={() => {
                setScope("all");
                setOpenId(null);
              }}
              className={`${navBtn} ${
                scope === "all" && !open
                  ? "bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                  : "text-[var(--color-cs-text)] hover:bg-white/70"
              }`}
              aria-pressed={scope === "all"}
            >
              All document types
            </button>
          </div>
          <div className="mt-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Folders
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5">
            {visible.map(({ folder }) => {
              const selected = openId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => openFolder(folder.id)}
                  className={`${navBtn} ${
                    selected
                      ? "bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                      : "text-[var(--color-cs-text)] hover:bg-white/70"
                  }`}
                  aria-current={selected ? "page" : undefined}
                >
                  <FolderIcon tint={folder.tint} className="h-4 w-5 shrink-0" />
                  <span className="truncate">{folder.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="mb-3 flex gap-1 md:hidden" role="group" aria-label="Which folders">
            <button
              type="button"
              onClick={() => {
                setScope("case");
                setOpenId(null);
              }}
              className={`rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ${
                scope === "case"
                  ? "bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                  : "text-[var(--color-cs-text-secondary)]"
              }`}
            >
              This case
            </button>
            <button
              type="button"
              onClick={() => {
                setScope("all");
                setOpenId(null);
              }}
              className={`rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ${
                scope === "all"
                  ? "bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                  : "text-[var(--color-cs-text-secondary)]"
              }`}
            >
              All types
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No folders match that search.</p>
          ) : open ? (
            <div>
              <div className="mb-3">
                <div className="text-[16px] font-bold tracking-tight">{open.folder.label}</div>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">{open.folder.hint}</p>
              </div>
              {renderSlots(open.folder, open.slots, open.loose)}
            </div>
          ) : view === "cards" ? (
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5">
              {visible.map(({ folder }) => {
                const neededOpen = folder.slots.filter(
                  (slot) => slot.attention === "needed" && !folder.docs.some((doc) => doc.slotId === slot.id),
                ).length;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => openFolder(folder.id)}
                    className="flex flex-col items-center rounded-xl px-2 py-3 text-center hover:bg-[var(--color-cs-surface)]"
                  >
                    <FolderIcon tint={folder.tint} className="h-14 w-[4.25rem]" />
                    <div className="mt-1.5 line-clamp-2 w-full text-[12.5px] font-medium leading-tight text-[var(--color-cs-text)]">
                      {folder.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] ${
                        neededOpen > 0
                          ? "font-semibold text-[var(--color-cs-warning)]"
                          : "text-[var(--color-cs-text-secondary)]"
                      }`}
                    >
                      {neededOpen > 0
                        ? `${neededOpen} missing`
                        : `${folder.docs.length} file${folder.docs.length === 1 ? "" : "s"}`}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 border-b border-[var(--color-cs-sep)] px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                <span>Name</span>
                <span>Files</span>
                <span>Needed</span>
              </div>
              {visible.map(({ folder }) => {
                const neededOpen = folder.slots.filter(
                  (slot) => slot.attention === "needed" && !folder.docs.some((doc) => doc.slotId === slot.id),
                ).length;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => openFolder(folder.id)}
                    className="grid w-full grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[var(--color-cs-surface)]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FolderIcon tint={folder.tint} className="h-5 w-6 shrink-0" />
                      <span className="truncate text-[14px] font-medium">{folder.label}</span>
                    </span>
                    <span className="text-[13px] tabular-nums text-[var(--color-cs-text-secondary)]">
                      {folder.docs.length}
                    </span>
                    <span
                      className={`text-[13px] tabular-nums ${
                        neededOpen > 0
                          ? "font-semibold text-[var(--color-cs-warning)]"
                          : "text-[var(--color-cs-text-secondary)]"
                      }`}
                    >
                      {neededOpen}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-1.5 text-[12px] text-[var(--color-cs-text-secondary)]">
        <span className="tabular-nums">
          {itemCount} item{itemCount === 1 ? "" : "s"}
          {open ? ` in ${open.folder.label}` : ""}
        </span>
        <span className="flex items-center gap-2 tabular-nums">
          <span className="hidden h-1 w-16 overflow-hidden rounded-full bg-[var(--color-cs-fill)] sm:block">
            <span className="block h-full bg-[var(--color-cs-brand)]" style={{ width: `${pct}%` }} />
          </span>
          {proofFiled} of {proofNeeded} on file
        </span>
      </div>
    </section>
  );
}
