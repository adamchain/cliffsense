"use client";

import { useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconChevronLeft,
  IconCircleCheck,
  IconInbox,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { VaultDocumentRow } from "./document-row";
import { VaultAddFile } from "./vault-upload";

export type VaultDocView = {
  id: string;
  filename: string;
  sizeLabel: string;
  uploadedLabel: string;
  slotId: string | null;
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
}: {
  beneficiaryId: string;
  folders: VaultFolderView[];
  proofFiled: number;
  proofNeeded: number;
  screened: boolean;
}) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [scope, setScope] = useState<"case" | "all">(screened ? "case" : "all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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
                  {docs.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {docs.map((doc) => (
                        <VaultDocumentRow
                          key={doc.id}
                          id={doc.id}
                          filename={doc.filename}
                          sizeLabel={doc.sizeLabel}
                          uploadedLabel={doc.uploadedLabel}
                        />
                      ))}
                    </ul>
                  )}
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
            ) : (
              <ul className="space-y-1.5">
                {loose.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    id={doc.id}
                    filename={doc.filename}
                    sizeLabel={doc.sizeLabel}
                    uploadedLabel={doc.uploadedLabel}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="mt-4">
      <div className="mb-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[15px] font-semibold">Opening file</div>
          <div className="text-[13px] tabular-nums text-[var(--color-cs-text-secondary)]">
            {proofFiled} of {proofNeeded} on file
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-cs-fill)]">
          <div
            className="h-full rounded-full bg-[var(--color-cs-brand)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
          {screened
            ? "Missing proof follows the benefits and authority on this case. Other document types stay in All."
            : "Identity comes first. Screen benefits so the vault can mark the proof this case actually needs."}
        </p>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="cs-search sm:max-w-sm">
          <IconSearch size={18} stroke={1.8} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a document, like BPQY or QMB"
            aria-label="Find a document"
          />
        </label>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-[var(--color-cs-fill)] p-0.5" role="group" aria-label="Which folders">
            <button
              type="button"
              onClick={() => setScope("case")}
              className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold ${
                scope === "case" ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm" : "text-[var(--color-cs-text-secondary)]"
              }`}
              aria-pressed={scope === "case"}
            >
              This case
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold ${
                scope === "all" ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm" : "text-[var(--color-cs-text-secondary)]"
              }`}
              aria-pressed={scope === "all"}
            >
              All document types
            </button>
          </div>
          <div className="inline-flex rounded-lg bg-[var(--color-cs-fill)] p-0.5" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold ${
                view === "cards" ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm" : "text-[var(--color-cs-text-secondary)]"
              }`}
              aria-pressed={view === "cards"}
            >
              <IconLayoutGrid size={15} stroke={2} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold ${
                view === "list" ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm" : "text-[var(--color-cs-text-secondary)]"
              }`}
              aria-pressed={view === "list"}
            >
              <IconList size={15} stroke={2} />
              List
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No document types match that search.</p>
      ) : view === "cards" ? (
        <>
          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${open ? "hidden sm:grid" : ""}`}>
            {visible.map(({ folder }) => {
              const neededOpen = folder.slots.filter(
                (slot) => slot.attention === "needed" && !folder.docs.some((doc) => doc.slotId === slot.id),
              ).length;
              const selected = openId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === folder.id ? null : folder.id))}
                  className={`group flex flex-col items-center rounded-[18px] px-3 pb-3 pt-4 text-center transition ${
                    selected
                      ? "bg-[var(--color-cs-brand-soft)] ring-2 ring-[var(--color-cs-brand)]/30"
                      : "bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[var(--color-cs-surface)]"
                  }`}
                >
                  <FolderIcon tint={folder.tint} className="h-14 w-[4.25rem] drop-shadow-sm transition group-hover:scale-[1.03]" />
                  <div className="mt-2 w-full text-[13.5px] font-semibold leading-tight text-[var(--color-cs-text)]">
                    {folder.label}
                  </div>
                  <div className={`mt-0.5 text-[11.5px] ${neededOpen > 0 ? "font-semibold text-[var(--color-cs-warning)]" : "text-[var(--color-cs-text-secondary)]"}`}>
                    {neededOpen > 0
                      ? `${neededOpen} missing`
                      : `${folder.docs.length} file${folder.docs.length === 1 ? "" : "s"}`}
                  </div>
                </button>
              );
            })}
          </div>

          {open && (
            <div className="sm:mt-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-cs-brand)] sm:hidden"
                onClick={() => setOpenId(null)}
              >
                <IconChevronLeft size={16} stroke={2.2} aria-hidden />
                All folders
              </button>
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[16px] font-bold tracking-tight">{open.folder.label}</div>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">{open.folder.hint}</p>
                </div>
                <button type="button" className="cs-circbtn !h-8 !w-8" aria-label="Close folder" onClick={() => setOpenId(null)}>
                  <IconX size={16} stroke={2.2} />
                </button>
              </div>
              {renderSlots(open.folder, open.slots, open.loose)}
            </div>
          )}
        </>
      ) : (
        <div className="overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {visible.map(({ folder, slots, loose }) => (
            <div key={folder.id} className="border-b border-[var(--color-cs-sep)] last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenId((cur) => (cur === folder.id ? null : folder.id))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <FolderIcon tint={folder.tint} className="h-8 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium">{folder.label}</div>
                  <div className="truncate text-[12.5px] text-[var(--color-cs-text-secondary)]">{folder.hint}</div>
                </div>
              </button>
              {openId === folder.id && (
                <div className="border-t border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-4 py-1">
                  {renderSlots(folder, slots, loose)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
