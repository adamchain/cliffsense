"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROGRAMS } from "@/lib/programs";

export function ProgramsForm({
  beneficiaryId,
  initialPrograms,
}: {
  beneficiaryId: string;
  initialPrograms: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialPrograms));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(p: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const benefitsEnrolled = [...selected].map((program) => ({ program }));
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save programs");
      return;
    }
    setSaved(true);
    // Refresh so the Limits page and dashboard reflect the new program set.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
        Reference limits attach automatically for the programs you select.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROGRAMS.map((p) => {
          const on = selected.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`rounded border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                on
                  ? "border-2 border-[var(--color-cs-brand)] bg-[#f5faff] py-[7px]"
                  : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex items-center gap-3 border-t border-[var(--color-cs-border)] pt-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-[var(--color-cs-brand)] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save programs"}
        </button>
        {saved && <span className="text-[12px] text-[var(--color-cs-success)]">Saved</span>}
      </div>
    </form>
  );
}
