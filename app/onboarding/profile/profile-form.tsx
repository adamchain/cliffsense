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
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#323130]" htmlFor="fn">
            First name
          </label>
          <input
            id="fn"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-8 rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#323130]" htmlFor="ln">
            Last name
          </label>
          <input
            id="ln"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-8 rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#323130]" htmlFor="st">
          State (2 letters)
        </label>
        <UsStateSelect id="st" value={state} onChange={setState} disabled={loading} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#323130]" htmlFor="hh">
          Household size
        </label>
        <input
          id="hh"
          type="number"
          min={1}
          value={householdSize}
          onChange={(e) => setHouseholdSize(Number(e.target.value))}
          className="h-8 max-w-[120px] rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
        />
      </div>
      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end border-t border-[var(--color-cs-border)] pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
