"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AgreementForm() {
  const router = useRouter();
  const { update } = useSession();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return;
    setError(null);
    setLoading(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betaAgreementAccepted: true, onboardingStep: "setup" }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not save. Please try again.");
      return;
    }
    await update({ onboardingStep: "setup" });
    router.push("/onboarding/setup");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card space-y-3 p-6 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)] md:p-7">
        <p>
          Bene-Watch is a free family-and-friends beta from P3 Development Partners LLC. We can end
          the beta, or one account, at any time.
        </p>
        <p>
          It keeps a record of someone’s benefits, renewal dates, and warnings. It is not a
          government agency, a law firm, a benefits counselor, or a trustee. It does not decide
          eligibility or guarantee that coverage will continue. An alert is an estimate from what
          was entered. A notice from the agency controls.
        </p>
        <p>
          Enter information only for yourself, or for a person who agreed you may keep this record.
          An account does not make you their representative with any agency. A bank connection is
          optional and comes later. We do not sell personal information. You can stop and ask us to
          delete the account.
        </p>
        <label className="flex cursor-pointer gap-3 pt-1 text-[13px] leading-relaxed text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--color-cs-brand)]"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            required
          />
          <span>I am at least 18, and I agree to this beta.</span>
        </label>
      </div>
      {error ? <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={loading || !accepted} className="cs-btn cs-btn-primary">
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
