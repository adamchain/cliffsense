"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function RoleOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [ack, setAck] = useState(false);
  const [payeeAck, setPayeeAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ack || !payeeAck) return;
    setError(null);
    setLoading(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "profile" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not save. Please try again.");
      return;
    }
    await update({ onboardingStep: "profile" });
    router.push("/onboarding/profile");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card space-y-4 p-6 md:p-7">
        <p className="text-[14px] leading-relaxed text-[var(--color-cs-text)]">
          A Benefit Monitor organizes records, tracks rules and deadlines, reconciles notices, and
          coordinates action. It is an operational role, not a government-created legal status.
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          Legal authority to act for a beneficiary must come from the beneficiary, a valid legal
          instrument, an agency appointment, or another recognized authorization. One authorization
          does not cover every agency or account.
        </p>
        <div className="rounded-xl border border-[var(--color-cs-warning)]/35 bg-[var(--color-cs-warning-bg)] px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--color-cs-text)]">Critical SSA rule</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Representative-payee status is separate from a Power of Attorney. Do not describe anyone
            as representative payee unless SSA has made that appointment.
          </p>
        </div>
        <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--color-cs-brand)]"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            required
          />
          <span>
            I understand BeneWatch does not determine eligibility and that I must identify the
            exact program and category before treating someone as over income or over assets.
          </span>
        </label>
        <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--color-cs-brand)]"
            checked={payeeAck}
            onChange={(e) => setPayeeAck(e.target.checked)}
            required
          />
          <span>I will not treat a POA as a substitute for an SSA representative-payee appointment.</span>
        </label>
      </div>
      {error ? <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={loading || !ack || !payeeAck} className="cs-btn cs-btn-primary">
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
