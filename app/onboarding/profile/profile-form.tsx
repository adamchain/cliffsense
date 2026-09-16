"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UsStateSelect } from "@/components/forms/us-state-select";
import { DISABILITY_OPTIONS, MARITAL_OPTIONS } from "@/lib/onboarding/opening";
import { nextStepAfterProfile, pathForOnboardingStepId } from "@/lib/onboarding/steps";

function dobInput(value: unknown): string {
  if (!value) return "";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function OnboardingProfileForm({ accountType }: { accountType: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [maritalStatus, setMaritalStatus] = useState("");
  const [disabilityStatus, setDisabilityStatus] = useState("");
  const [preferredCommunications, setPreferredCommunications] = useState("");
  const [loading, setLoading] = useState(false);
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
              isOwner?: boolean;
              firstName?: string;
              lastName?: string;
              dateOfBirth?: string;
              state?: string;
              county?: string;
              householdSize?: number;
              opening?: {
                address?: string;
                maritalStatus?: string;
                disabilityStatus?: string;
                preferredCommunications?: string;
              };
            }[];
          }
        ).beneficiaries ?? [];
      const primary = list.find((b) => b.isOwner) ?? list[0];
      if (!primary || cancelled) return;
      setFirstName(primary.firstName ?? "");
      setLastName(primary.lastName ?? "");
      setDateOfBirth(dobInput(primary.dateOfBirth));
      setState(primary.state ?? "");
      setCounty(primary.county ?? "");
      setHouseholdSize(primary.householdSize ?? 1);
      setAddress(primary.opening?.address ?? "");
      setMaritalStatus(primary.opening?.maritalStatus ?? "");
      setDisabilityStatus(primary.opening?.disabilityStatus ?? "");
      setPreferredCommunications(primary.opening?.preferredCommunications ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const nextStep = nextStepAfterProfile(accountType);
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
          county: county.trim(),
          householdSize,
          dateOfBirth,
          address: address.trim(),
          maritalStatus,
          disabilityStatus,
          preferredCommunications: preferredCommunications.trim(),
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
    router.push(pathForOnboardingStepId(nextStep));
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
          <label className="cs-label" htmlFor="dob">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="cs-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="addr">
            Address
          </label>
          <input
            id="addr"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="cs-input"
            autoComplete="street-address"
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="st">
              State
            </label>
            <UsStateSelect id="st" value={state} onChange={setState} disabled={loading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="county">
              County
            </label>
            <input
              id="county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="cs-input"
            />
          </div>
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
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="marital">
            Marital status
          </label>
          <select
            id="marital"
            required
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
            className="cs-input cursor-pointer"
          >
            <option value="" disabled>
              Select…
            </option>
            {MARITAL_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="dis">
            Disability status (where relevant to benefits)
          </label>
          <select
            id="dis"
            required
            value={disabilityStatus}
            onChange={(e) => setDisabilityStatus(e.target.value)}
            className="cs-input cursor-pointer"
          >
            <option value="" disabled>
              Select…
            </option>
            {DISABILITY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="pref">
            Preferred communications
          </label>
          <input
            id="pref"
            value={preferredCommunications}
            onChange={(e) => setPreferredCommunications(e.target.value)}
            className="cs-input"
            placeholder="Email, phone, text, mail…"
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
