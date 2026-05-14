"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BenefitsForm({ programs }: { programs: readonly string[] }) {
  const router = useRouter();
  const { update } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json().catch(() => ({}));
      const list =
        (
          data as {
            beneficiaries?: {
              _id: string;
              isOwner?: boolean;
              benefitsEnrolled?: { program: string }[];
            }[];
          }
        ).beneficiaries ?? [];
      const primary = list.find((b) => b.isOwner) ?? list[0];
      if (!primary) {
        setError("No beneficiary profile found. Complete the profile step first.");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setBeneficiaryId(primary._id);
      const enrolled = new Set(primary.benefitsEnrolled?.map((b) => b.program) ?? []);
      setSelected(enrolled);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(p: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId) return;
    setSaving(true);
    setError(null);
    const benefitsEnrolled = [...selected].map((program) => ({ program }));
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    if (!res.ok) {
      setError("Could not save programs");
      setSaving(false);
      return;
    }
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "notifications" }),
    });
    await update({ onboardingStep: "notifications" });
    router.push("/onboarding/notifications");
    router.refresh();
    setSaving(false);
  }

  if (loading) {
    return <p className="mt-8 text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {programs.map((p) => {
          const on = selected.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`rounded border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                on
                  ? "border-2 border-[var(--color-cs-brand)] bg-[#f5faff] py-[9px]"
                  : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end border-t border-[var(--color-cs-border)] pt-4">
        <button
          type="submit"
          disabled={saving || selected.size === 0}
          className="rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
