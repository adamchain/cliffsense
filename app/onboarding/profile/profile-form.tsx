"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UsStateSelect } from "@/components/forms/us-state-select";

export function OnboardingProfileForm({ accountType }: { accountType: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const nextStep =
      accountType === "beneficiary" ? "plaid" : "beneficiary";
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayName,
        onboardingStep: nextStep,
        ownerProfile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          state: state.toUpperCase(),
          householdSize,
        },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not save");
      return;
    }
    await update({ onboardingStep: nextStep, name: displayName });
    router.push(nextStep === "plaid" ? "/onboarding/plaid" : "/onboarding/beneficiary");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card space-y-5 p-6 md:p-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="fn">
              First name
            </label>
            <input
              id="fn"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="cs-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="ln">
              Last name
            </label>
            <input
              id="ln"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="cs-input"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="st">
            State
          </label>
          <UsStateSelect id="st" value={state} onChange={setState} disabled={loading} />
        </div>
        <div className="flex max-w-[180px] flex-col gap-1.5">
          <label className="cs-label" htmlFor="hh">
            Household size
          </label>
          <input
            id="hh"
            type="number"
            min={1}
            value={householdSize}
            onChange={(e) => setHouseholdSize(Number(e.target.value))}
            className="cs-input"
          />
        </div>
      </div>
      {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="cs-btn cs-btn-primary">
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
