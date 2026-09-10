"use client";

import { useEffect } from "react";

const SECTIONS = [
  { id: "alerts", label: "Alerts" },
  { id: "limits", label: "Limits" },
  { id: "programs", label: "Programs" },
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
] as const;

export function BenefitsHubNav() {
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-0 z-20 -mx-4 mb-5 overflow-x-auto border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)]/95 px-4 py-2 backdrop-blur sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0 lg:top-16"
    >
      <div className="flex gap-1">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
