"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AUTHORITY_OPTIONS, MANAGER_FIELDS } from "@/lib/onboarding/opening";

type Inner = 1 | 2;

export function AuthorityOnboardingForm({ accountType }: { accountType: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [inner, setInner] = useState<Inner>(1);
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorities, setAuthorities] = useState<Set<string>>(new Set(["consent"]));
  const [managers, setManagers] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json().catch(() => ({}));
      const list =
        (
          data as {
            beneficiaries?: { _id: string; isOwner?: boolean; opening?: { authorities?: string[]; managers?: Record<string, string> } }[];
          }
        ).beneficiaries ?? [];
      const primary =
        accountType === "beneficiary"
          ? list.find((b) => b.isOwner) ?? list[0]
          : list.find((b) => !b.isOwner) ?? list[0];
      if (!primary) {
        setError("Complete the identity step first.");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setBeneficiaryId(primary._id);
      const opening = primary.opening;
      if (opening?.authorities?.length) setAuthorities(new Set(opening.authorities));
      if (opening?.managers) setManagers(opening.managers);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accountType]);

  function toggleAuthority(id: string) {
    setAuthorities((prev) => {
      const next = new Set(prev);
      if (id === "consent") {
        next.add("consent");
        return next;
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveOpening() {
    if (!beneficiaryId) return false;
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opening: {
          consentAcknowledged: true,
          authorities: [...authorities],
          managers,
        },
      }),
    });
    return res.ok;
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const ok = await saveOpening();
    if (!ok) {
      setError("Could not save authority details.");
      setSaving(false);
      return;
    }
    const me = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "benefits" }),
    });
    if (!me.ok) {
      setError("Saved, but could not advance onboarding.");
      setSaving(false);
      return;
    }
    await update({ onboardingStep: "benefits" });
    router.push("/onboarding/benefits");
    router.refresh();
    setSaving(false);
  }

  if (loading) {
    return <p className="mt-8 text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {inner === 1 ? (
        <div className="cs-card space-y-3 p-6 md:p-7">
          <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Select every authority that actually applies. Do not assume one instrument covers SSA,
            DHS, a bank, a trustee, and an ABLE account.
          </p>
          <div className="space-y-2">
            {AUTHORITY_OPTIONS.map((opt) => {
              const on = authorities.has(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleAuthority(opt.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    on
                      ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)]"
                      : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]/55"
                  }`}
                >
                  <p className="text-[13px] font-semibold text-[var(--color-cs-text)]">{opt.label}</p>
                  <p className="mt-1 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
                    {opt.permits}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--color-cs-text-muted)]">
                    {opt.doesNot}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cs-card space-y-4 p-6 md:p-7">
          <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Who currently manages each function? Use a name, “self,” or “unknown.”
          </p>
          {MANAGER_FIELDS.map((f) => (
            <div key={f.id} className="flex flex-col gap-1.5">
              <label className="cs-label" htmlFor={`mgr-${f.id}`}>
                {f.label}
              </label>
              <input
                id={`mgr-${f.id}`}
                value={managers[f.id] ?? ""}
                onChange={(e) => setManagers((m) => ({ ...m, [f.id]: e.target.value }))}
                className="cs-input"
                placeholder="Name, self, or unknown"
              />
            </div>
          ))}
        </div>
      )}
      {error ? <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
      <div className="flex justify-between">
        {inner === 2 ? (
          <button type="button" className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline" onClick={() => setInner(1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        {inner === 1 ? (
          <button type="button" className="cs-btn cs-btn-primary" onClick={() => setInner(2)}>
            Continue
          </button>
        ) : (
          <button type="button" disabled={saving} className="cs-btn cs-btn-primary" onClick={() => void finish()}>
            {saving ? "Saving…" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}
