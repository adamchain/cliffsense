"use client";

import { useMemo, useState } from "react";
import { IconLayoutGrid, IconList, IconX } from "@tabler/icons-react";
import { VaultDocumentRow } from "./document-row";

export type VaultFolder = {
  id: string;
  label: string;
  hint: string;
  docs: {
    id: string;
    filename: string;
    sizeLabel: string;
    uploadedLabel: string;
  }[];
};

function AppleFolderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 80"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tab */}
      <path
        d="M16 14h18.2c1.7 0 3.2.8 4.2 2.1L42 22H16c-2.2 0-4-1.8-4-4s1.8-4 4-4z"
        fill="#64D2FF"
      />
      {/* Body */}
      <path
        d="M8 22c0-4.4 3.6-8 8-8h18.2c2.5 0 4.8 1.2 6.2 3.2L44 22h36c4.4 0 8 3.6 8 8v34c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V22z"
        fill="#0A84FF"
      />
      {/* Front face highlight */}
      <path
        d="M12 34c0-3.3 2.7-6 6-6h60c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6H18c-3.3 0-6-2.7-6-6V34z"
        fill="#007AFF"
      />
      <path d="M12 34h72v3.5H12z" fill="#5AC8FA" opacity="0.55" />
    </svg>
  );
}

export function VaultBrowser({ folders }: { folders: VaultFolder[] }) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [openId, setOpenId] = useState<string | null>(null);

  const openFolder = useMemo(
    () => folders.find((f) => f.id === openId) ?? null,
    [folders, openId],
  );

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-tight text-[var(--color-cs-text)]">
          Documents
        </h2>
        <div
          className="inline-flex rounded-lg bg-[var(--color-cs-surface)] p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition ${
              view === "cards"
                ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
            aria-pressed={view === "cards"}
          >
            <IconLayoutGrid size={15} stroke={2} />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition ${
              view === "list"
                ? "bg-[var(--color-cs-card)] text-[var(--color-cs-brand)] shadow-sm"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
            aria-pressed={view === "list"}
          >
            <IconList size={15} stroke={2} />
            List
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((f) => {
              const selected = openId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
                  className={`group flex flex-col items-center rounded-[18px] px-3 pb-3 pt-4 text-center transition ${
                    selected
                      ? "bg-[var(--color-cs-brand-soft)] ring-2 ring-[var(--color-cs-brand)]/30"
                      : "bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[var(--color-cs-surface)]"
                  }`}
                >
                  <AppleFolderIcon className="h-14 w-[4.25rem] drop-shadow-sm transition group-hover:scale-[1.03]" />
                  <div className="mt-2 w-full truncate text-[13.5px] font-semibold text-[var(--color-cs-text)]">
                    {f.label}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">
                    {f.docs.length} item{f.docs.length === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>

          {openFolder && (
            <div className="mt-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[16px] font-bold tracking-tight">{openFolder.label}</div>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">
                    {openFolder.hint}
                  </p>
                </div>
                <button
                  type="button"
                  className="cs-circbtn !h-8 !w-8"
                  aria-label="Close folder"
                  onClick={() => setOpenId(null)}
                >
                  <IconX size={16} stroke={2.2} />
                </button>
              </div>
              {openFolder.docs.length === 0 ? (
                <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No documents yet.</p>
              ) : (
                <ul className="space-y-2">
                  {openFolder.docs.map((d) => (
                    <VaultDocumentRow
                      key={d.id}
                      id={d.id}
                      filename={d.filename}
                      sizeLabel={d.sizeLabel}
                      uploadedLabel={d.uploadedLabel}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="cs-ios-list overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {folders.map((f) => (
            <div key={f.id} className="border-b border-[var(--color-cs-sep)] last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <AppleFolderIcon className="h-8 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium">{f.label}</div>
                  <div className="truncate text-[12.5px] text-[var(--color-cs-text-secondary)]">
                    {f.hint}
                  </div>
                </div>
                <span className="shrink-0 text-[13px] text-[var(--color-cs-text-secondary)]">
                  {f.docs.length}
                </span>
              </button>
              {openId === f.id && (
                <div className="border-t border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-4 py-3">
                  {f.docs.length === 0 ? (
                    <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No documents yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {f.docs.map((d) => (
                        <VaultDocumentRow
                          key={d.id}
                          id={d.id}
                          filename={d.filename}
                          sizeLabel={d.sizeLabel}
                          uploadedLabel={d.uploadedLabel}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
