"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgramPicker } from "@/components/benefits/program-picker";
import { expandLegacyMedicaidSelection, type Program } from "@/lib/programs";

export function BenefitsForm(_props: { programs: readonly string[] }) {
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
      const enrolled = new Set(
        expandLegacyMedicaidSelection(primary.benefitsEnrolled?.map((b) => b.program) ?? []),
      );
      setSelected(enrolled);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(p: Program) {
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card p-6 md:p-7">
        <ProgramPicker selected={selected} onToggle={toggle} />
      </div>
      {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || selected.size === 0}
          className="cs-btn cs-btn-primary"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
