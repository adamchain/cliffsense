"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconChevronDown, IconPencil } from "@tabler/icons-react";

export type BeneficiarySwitcherAccount = {
  id: string;
  name: string;
  roleLabel: string;
};

export function BeneficiarySwitcher({
  currentId,
  currentName,
  accounts,
  variant = "hero",
  initials,
}: {
  currentId: string | null;
  currentName: string;
  accounts: BeneficiarySwitcherAccount[];
  /** `sidebar` is the compact account row at the bottom of the left nav. */
  variant?: "hero" | "sidebar";
  initials?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(id: string) {
    if (id === currentId || pending) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/beneficiaries/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId: id }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  const menu = open && (
        <div
          role="listbox"
          aria-label="Beneficiaries"
          className={`absolute left-0 z-40 max-h-80 overflow-y-auto rounded-[14px] border border-[var(--color-cs-border)] bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
            variant === "sidebar" ? "bottom-full mb-1 w-full" : "mt-2 w-[min(calc(100vw-2rem),280px)]"
          }`}
        >
          {accounts.map((a) => {
            const selected = a.id === currentId;
            return (
              <div
                key={a.id}
                className="flex items-stretch hover:bg-[var(--color-cs-nav-hover)]"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={pending}
                  onClick={() => select(a.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--color-cs-text)]">
                      {a.name}
                    </span>
                    <span className="block text-[11px] text-[var(--color-cs-text-secondary)]">
                      {a.roleLabel}
                    </span>
                  </span>
                  {selected && (
                    <IconCheck size={16} stroke={2.2} className="shrink-0 text-[var(--color-cs-brand)]" />
                  )}
                </button>
                <Link
                  href={`/beneficiaries?edit=${encodeURIComponent(a.id)}`}
                  aria-label={`Edit ${a.name}`}
                  title="Edit details"
                  className="flex items-center px-2.5 text-[var(--color-cs-text-muted)] hover:text-[var(--color-cs-brand)]"
                  onClick={() => setOpen(false)}
                >
                  <IconPencil size={16} stroke={1.8} />
                </Link>
              </div>
            );
          })}
          <Link
            href={currentId ? `/beneficiaries?edit=${encodeURIComponent(currentId)}` : "/beneficiaries"}
            className="block border-t border-[var(--color-cs-sep)] px-3 py-2.5 text-[13px] font-medium text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
            onClick={() => setOpen(false)}
          >
            Edit details
          </Link>
        </div>
  );

  if (variant === "sidebar") {
    return (
      <div ref={rootRef} className="relative min-w-0">
        <button
          type="button"
          className="cs-macos-sidebar-item w-full cursor-pointer border-0 bg-transparent text-left"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Switch beneficiary. Current: ${currentName}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-avatar)] text-[10px] font-bold text-white">
            {initials || currentName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{currentName}</span>
          <IconChevronDown
            size={14}
            stroke={2.4}
            className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {menu}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Link
        href="/beneficiaries"
        data-tour="home-beneficiary"
        className="group flex min-w-0 items-center gap-1.5 text-[var(--color-cs-text)]"
      >
        <h1 className="cs-big-title truncate">{currentName}</h1>
        <IconChevronDown
          size={17}
          stroke={3}
          className="shrink-0 text-[var(--color-cs-text-muted)]"
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0" data-tour="home-beneficiary">
      <button
        type="button"
        className="group flex min-w-0 items-center gap-1.5 text-left text-[var(--color-cs-text)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch beneficiary. Current: ${currentName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <h1 className="cs-big-title truncate">{currentName}</h1>
        <IconChevronDown
          size={17}
          stroke={3}
          className={`shrink-0 text-[var(--color-cs-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
