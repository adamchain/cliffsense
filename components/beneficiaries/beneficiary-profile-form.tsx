"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_STATES } from "@/lib/constants/us-states";

export type BeneficiaryProfileValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  state: string;
  county: string;
  householdSize: number;
};

export function BeneficiaryProfileForm({
  beneficiaryId,
  initial,
  canWrite,
  compact = false,
}: {
  beneficiaryId: string;
  initial: BeneficiaryProfileValues;
  canWrite: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [state, setState] = useState(initial.state);
  const [county, setCounty] = useState(initial.county);
  const [householdSize, setHouseholdSize] = useState(initial.householdSize);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || null,
        state: state || "",
        county: county.trim(),
        householdSize,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const fieldClass = "cs-input mt-1.5";
  const labelClass = "cs-label";

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>First name</span>
          <input
            required
            value={firstName}
            disabled={!canWrite}
            onChange={(e) => {
              setFirstName(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
            autoComplete="given-name"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Last name</span>
          <input
            required
            value={lastName}
            disabled={!canWrite}
            onChange={(e) => {
              setLastName(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
            autoComplete="family-name"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Date of birth</span>
          <input
            type="date"
            value={dateOfBirth}
            disabled={!canWrite}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Household size</span>
          <input
            type="number"
            min={1}
            value={householdSize}
            disabled={!canWrite}
            onChange={(e) => {
              setHouseholdSize(Number(e.target.value) || 1);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>State</span>
          <select
            value={state}
            disabled={!canWrite}
            onChange={(e) => {
              setState(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
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
          <span className={labelClass}>County</span>
          <input
            value={county}
            disabled={!canWrite}
            onChange={(e) => {
              setCounty(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </label>
      </div>
      {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      {canWrite ? (
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-[12px] text-[var(--color-cs-text-secondary)]">Saved</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[var(--color-cs-brand)] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
          You have view-only access to this profile.
        </p>
      )}
    </form>
  );
}
