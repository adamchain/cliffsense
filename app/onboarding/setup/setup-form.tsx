"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UsStateSelect } from "@/components/forms/us-state-select";
import type { Program } from "@/lib/programs";

const PROGRAMS: { id: Program; label: string }[] = [
  { id: "SSDI", label: "SSDI" },
  { id: "DAC", label: "DAC" },
  { id: "SSI", label: "SSI" },
  { id: "QMB", label: "QMB" },
  { id: "ExtraHelp", label: "Extra Help" },
  { id: "SNAP", label: "SNAP" },
  { id: "MedicaidABD", label: "Medicaid — Healthy Horizons" },
  { id: "MedicaidMAGI", label: "Medicaid — MAGI" },
  { id: "MedicaidWaiver", label: "Waiver" },
  { id: "MAWD", label: "MAWD" },
  { id: "ABLE", label: "ABLE" },
];

function dateInput(value: unknown): string {
  if (!value) return "";
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

type Ben = {
  _id: string;
  isOwner?: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  state?: string;
  householdSize?: number;
  benefitsEnrolled?: { program?: string; nextRenewalDate?: string | null }[];
};

export function SetupForm({ accountType, defaultName }: { accountType: string; defaultName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const self = accountType === "beneficiary";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [state, setState] = useState("PA");
  const [householdSize, setHouseholdSize] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renewals, setRenewals] = useState<Record<string, string>>({});
  const [extraPrograms, setExtraPrograms] = useState<{ program: string; nextRenewalDate: string | null }[]>([]);
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json().catch(() => ({}));
      const list = ((data as { beneficiaries?: Ben[] }).beneficiaries ?? []);
      const primary = self ? list.find((b) => b.isOwner) ?? list[0] : list.find((b) => !b.isOwner) ?? list[0];
      if (cancelled) return;
      if (primary) {
        setBeneficiaryId(primary._id);
        setFirstName(primary.firstName ?? "");
        setLastName(primary.lastName ?? "");
        setDateOfBirth(dateInput(primary.dateOfBirth));
        setState(primary.state || "PA");
        setHouseholdSize(primary.householdSize ?? 1);
        const on = new Set<string>();
        const dates: Record<string, string> = {};
        const extras: { program: string; nextRenewalDate: string | null }[] = [];
        const offered = new Set(PROGRAMS.map((p) => p.id));
        for (const row of primary.benefitsEnrolled ?? []) {
          if (!row.program) continue;
          const d = dateInput(row.nextRenewalDate);
          if (!offered.has(row.program as Program)) {
            extras.push({ program: row.program, nextRenewalDate: d || null });
            continue;
          }
          on.add(row.program);
          if (d) dates[row.program] = d;
        }
        setSelected(on);
        setRenewals(dates);
        setExtraPrograms(extras);
      } else if (self && defaultName.trim()) {
        const parts = defaultName.trim().split(/\s+/);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [self, defaultName]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const person = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      state: state.toUpperCase(),
      householdSize,
      dateOfBirth: dateOfBirth || "",
      isOwner: self,
    };
    let id = beneficiaryId;
    if (!id) {
      const created = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(person),
      });
      const createdBody = await created.json().catch(() => ({}));
      if (!created.ok) {
        setError((createdBody as { error?: string }).error ?? "Could not save this person.");
        setSaving(false);
        return;
      }
      id = (createdBody as { beneficiary?: { _id?: string } }).beneficiary?._id ?? null;
    } else {
      const updated = await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
          state: person.state,
          householdSize: person.householdSize,
          dateOfBirth: person.dateOfBirth || null,
        }),
      });
      if (!updated.ok) {
        const j = await updated.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Could not save this person.");
        setSaving(false);
        return;
      }
    }
    if (!id) {
      setError("Could not save this person.");
      setSaving(false);
      return;
    }
    const benefitsEnrolled = [
      ...PROGRAMS.filter((p) => selected.has(p.id)).map((p) => ({
        program: p.id,
        nextRenewalDate: renewals[p.id] || null,
        ...(renewals[p.id] ? { renewalConfidence: "needs_confirmation" as const } : {}),
      })),
      ...extraPrograms.map((p) => ({
        program: p.program,
        nextRenewalDate: p.nextRenewalDate,
        ...(p.nextRenewalDate ? { renewalConfidence: "needs_confirmation" as const } : {}),
      })),
    ];
    const saved = await fetch(`/api/beneficiaries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitsEnrolled }),
    });
    if (!saved.ok) {
      const j = await saved.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Could not save programs.");
      setSaving(false);
      return;
    }
    await fetch("/api/beneficiaries/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId: id }),
    });
    const displayName = `${person.firstName} ${person.lastName}`.trim();
    const me = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(self ? { name: displayName } : {}),
        onboardingStep: "notifications",
      }),
    });
    if (!me.ok) {
      const j = await me.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Saved, but could not continue.");
      setSaving(false);
      return;
    }
    await update(self ? { onboardingStep: "notifications", name: displayName } : { onboardingStep: "notifications" });
    router.push("/onboarding/notifications");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card space-y-5 p-6 md:p-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="fn">
              First name
            </label>
            <input id="fn" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="cs-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="ln">
              Last name
            </label>
            <input id="ln" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="cs-input" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="st">
              State
            </label>
            <UsStateSelect id="st" value={state} onChange={setState} disabled={saving} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="cs-label" htmlFor="hh">
              Household size
            </label>
            <input
              id="hh"
              type="number"
              min={1}
              required
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="cs-input"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="dob">
            Date of birth <span className="font-normal text-[var(--color-cs-text-muted)]">(optional)</span>
          </label>
          <input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="cs-input"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="cs-label">Programs they have now</legend>
          <p className="text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
            Check each one. Add a renewal date if you have the notice. Leave the date blank if you do not.
          </p>
          {PROGRAMS.map((p) => {
            const on = selected.has(p.id);
            return (
              <div key={p.id} className="rounded-xl border border-[var(--color-cs-border)] px-3 py-2.5">
                <label className="flex cursor-pointer items-center gap-3 text-[13px] font-semibold text-[var(--color-cs-text)]">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-cs-brand)]"
                    checked={on}
                    onChange={() => toggle(p.id)}
                  />
                  {p.label}
                </label>
                {on ? (
                  <div className="mt-2 pl-7">
                    <label className="cs-label" htmlFor={`renew-${p.id}`}>
                      Next renewal
                    </label>
                    <input
                      id={`renew-${p.id}`}
                      type="date"
                      value={renewals[p.id] ?? ""}
                      onChange={(e) => setRenewals((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="cs-input mt-1"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>
      </div>
      {error ? <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="cs-btn cs-btn-primary">
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
