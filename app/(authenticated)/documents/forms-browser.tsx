"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconChevronDown,
  IconExternalLink,
  IconFileText,
  IconMessageChatbot,
  IconWorld,
} from "@tabler/icons-react";
import type { Program } from "@/lib/programs";
import type { CatalogForm } from "@/lib/forms/types";
import { programCodeKey, programMetaFor } from "@/lib/benefits/program-meta";
import { programAgencyTag, programTier } from "@/lib/benefits/program-tier";
import { PaKeystoneMark, PaStateChip, SsaSeal, UsFlagMark } from "@/components/benefits/wallet-seals";

type ProgramGroup = {
  program: Program;
  label: string;
  forms: CatalogForm[];
};

function FormRow({ form }: { form: CatalogForm }) {
  return (
    <li className="flex gap-3 rounded-[16px] bg-[var(--color-cs-surface)] px-3 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
        aria-hidden
      >
        <IconFileText size={20} stroke={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {form.formNumber ? (
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--color-cs-text-secondary)]">
              {form.formNumber}
            </span>
          ) : null}
          <span className="text-[14.5px] font-semibold text-[var(--color-cs-text)]">{form.title}</span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
          {form.purpose}
        </p>
        <p className="mt-1 text-[11.5px] text-[var(--color-cs-text-muted)]">
          {form.agency} · {form.frequency}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {form.fillableId ? (
            <Link
              href={`/documents/${form.fillableId}`}
              className="inline-flex items-center gap-1.5 rounded-[14px] bg-[var(--color-cs-brand)] px-2.5 py-1 text-[12px] font-semibold text-white"
            >
              <IconMessageChatbot size={14} stroke={1.8} aria-hidden />
              Fill out
            </Link>
          ) : null}
          <a
            href={form.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[14px] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            {form.online ? (
              <IconWorld size={14} stroke={1.8} aria-hidden />
            ) : (
              <IconExternalLink size={14} stroke={1.8} aria-hidden />
            )}
            {form.online ? "Open portal" : "Official form"}
          </a>
        </div>
      </div>
    </li>
  );
}

function ProgramSection({
  group,
  open,
  onToggle,
}: {
  group: ProgramGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const reporting = group.forms.filter((f) => f.category === "reporting");
  const reapply = group.forms.filter((f) => f.category === "reapply");
  const count = group.forms.length;

  const code = programCodeKey(group.program);
  const meta = programMetaFor(code);
  const fed = programTier(code) === "federal";
  const name = meta?.label ?? group.label;
  const fullName = meta?.fullName;

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className={`cs-wcard cs-wcard--mini ${fed ? "cs-wcard--fed" : "cs-wcard--state"}`}
        aria-expanded={open}
      >
        <div className="cs-wcard-seal" aria-hidden>
          {fed ? <SsaSeal /> : <PaKeystoneMark />}
        </div>
        <div className="cs-wcard-in">
          <div className="cs-wcard-top">
            <span className="cs-wcard-label">
              {fed ? <UsFlagMark className="cs-fed-flag" /> : <PaStateChip />}
              <span>{programAgencyTag(code)}</span>
            </span>
            <IconChevronDown
              size={18}
              stroke={2}
              className={`shrink-0 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
          <div className="cs-wcard-name">{name}</div>
          {fullName ? <p className="cs-wcard-sub">{fullName}</p> : null}
          <p className="cs-wcard-sub">
            {count} form{count === 1 ? "" : "s"}
          </p>
        </div>
      </button>

      {open && (
        <div className="mt-2 space-y-4 rounded-[18px] bg-[var(--color-cs-card)] px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              Reporting
            </h3>
            {reporting.length > 0 ? (
              <ul className="space-y-2">
                {reporting.map((f) => (
                  <FormRow key={f.id} form={f} />
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-[var(--color-cs-text-muted)]">
                No routine reporting form.
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              Reapply / Recertification
            </h3>
            {reapply.length > 0 ? (
              <ul className="space-y-2">
                {reapply.map((f) => (
                  <FormRow key={f.id} form={f} />
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-[var(--color-cs-text-muted)]">No reapply form.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function FormsBrowser({ groups }: { groups: ProgramGroup[] }) {
  const ids = useMemo(() => groups.map((g) => g.program), [groups]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const allOpen = ids.length > 0 && ids.every((id) => openIds.has(id));

  function toggle(program: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(program)) next.delete(program);
      else next.add(program);
      return next;
    });
  }

  function toggleAll() {
    setOpenIds(allOpen ? new Set() : new Set(ids));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[14px] font-semibold text-[var(--color-cs-brand)]"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {groups.map((g) => (
          <ProgramSection
            key={g.program}
            group={g}
            open={openIds.has(g.program)}
            onToggle={() => toggle(g.program)}
          />
        ))}
      </div>
    </div>
  );
}
