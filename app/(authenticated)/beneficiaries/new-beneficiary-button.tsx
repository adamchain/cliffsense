"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconX } from "@tabler/icons-react";
import { US_STATES } from "@/lib/constants/us-states";

export function NewBeneficiaryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/beneficiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        state: state || undefined,
        householdSize,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not add beneficiary");
      return;
    }
    setOpen(false);
    setFirstName("");
    setLastName("");
    setState("");
    setHouseholdSize(1);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
      >
        <IconPlus size={16} stroke={1.5} aria-hidden />
        Add beneficiary
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-xl"
          >
            <header className="flex items-center justify-between border-b border-[var(--color-cs-border)] bg-[var(--color-cs-brand)] px-4 py-3 text-white">
              <h2 className="text-sm font-medium">Add beneficiary</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-sm p-1 hover:bg-white/15"
              >
                <IconX size={16} stroke={1.5} />
              </button>
            </header>
            <div className="space-y-3 px-5 py-5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                    First name
                  </span>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                    Last name
                  </span>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                    State
                  </span>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2"
                  >
                    <option value="">—</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                    Household size
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
                    className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
                  />
                </label>
              </div>
              {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
            </div>
            <footer className="flex justify-end gap-2 border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-[var(--color-cs-border)] bg-white px-3 py-1.5 text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-sm bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Add"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}
