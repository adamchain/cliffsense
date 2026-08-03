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

  return (
    <section className="overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-cs-brand)] text-white"
          aria-hidden
        >
          <IconFileText size={18} stroke={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold text-[var(--color-cs-text)]">
            {group.label}
          </div>
          <div className="text-[12.5px] text-[var(--color-cs-text-secondary)]">
            {count} form{count === 1 ? "" : "s"}
          </div>
        </div>
        <IconChevronDown
          size={18}
          stroke={2}
          className={`shrink-0 text-[var(--color-cs-text-secondary)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-[var(--color-cs-sep)] px-4 py-3.5">
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
