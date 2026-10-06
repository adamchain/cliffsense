"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { VaultAddFile } from "@/app/(authenticated)/vault/vault-upload";
import { AUTHORITY_OPTIONS, MANAGER_FIELDS } from "@/lib/onboarding/opening";

const DOC_FOR_AUTHORITY: Record<string, { slot: string; label: string }> = {
  consent: { slot: "consent", label: "Upload Bene-Watch authorization" },
  poa: { slot: "poa", label: "Upload power of attorney" },
  ssa_payee: { slot: "payee", label: "Upload SSA payee appointment" },
  program_rep: { slot: "auth_rep", label: "Upload authorized-representative letter" },
  guardianship: { slot: "guardianship", label: "Upload guardianship order" },
  trustee: { slot: "account_authority", label: "Upload trustee authority" },
  able: { slot: "account_authority", label: "Upload ABLE authority" },
};

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
        <div className="cs-card space-y-4 p-6 md:p-7">
          {beneficiaryId ? (
            <div className="space-y-3 rounded-xl border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] p-4">
              <div>
                <p className="text-[15px] font-semibold text-[var(--color-cs-text)]">
                  Upload the authorization document
                </p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
                  Add the signed consent first. If another role applies, its upload appears here too.
                </p>
              </div>
              {[...authorities].flatMap((id) => {
                const doc = DOC_FOR_AUTHORITY[id];
                if (!doc) return [];
                const earlier = [...authorities].find((other) => DOC_FOR_AUTHORITY[other]?.slot === doc.slot);
                if (earlier !== id) return [];
                return [
                  <VaultAddFile
                    key={id}
                    beneficiaryId={beneficiaryId}
                    category="identity"
                    slot={doc.slot}
                    label={doc.label}
                    documentLabel={doc.label}
                    variant="prominent"
                  />,
                ];
              })}
            </div>
          ) : null}
          <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Check every authority that actually applies. One document does not cover SSA, DHS, a bank, a trustee, and an ABLE account.
          </p>
          <div className="space-y-3">
            {AUTHORITY_OPTIONS.map((opt) => {
              const on = authorities.has(opt.id);
              const locked = opt.id === "consent";
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 touch-manipulation ${
                    on
                      ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)]"
                      : "border-[var(--color-cs-border)] bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-cs-brand)]"
                    checked={on}
                    disabled={locked}
                    onChange={() => toggleAuthority(opt.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[var(--color-cs-text)]">{opt.label}</span>
                    <span className="mt-1 block text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
                      {opt.permits}
                    </span>
                  </span>
                </label>
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
