"use client";

import { useState } from "react";
import { centsToDollarInput, parseDollarsToCents } from "@/lib/snt/record";

const IRWE_PROGRAMS = new Set([
  "SSDI",
  "SSI",
  "DAC",
  "QMB",
  "MEDICAIDABD",
  "MAWD",
  "EXTRAHELP",
]);

export function programUsesIrwe(code: string): boolean {
  return IRWE_PROGRAMS.has(code);
}

/**
 * Monthly impairment-related work expenses. The same amount the SSA work-activity
 * report asks for. Stored on the person and used in the income math.
 */
export function IrweEditor({
  beneficiaryId,
  initialCents,
  onSaved,
}: {
  beneficiaryId: string;
  initialCents: number;
  onSaved: () => void;
}) {
  const [dollars, setDollars] = useState(centsToDollarInput(initialCents));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = dollars.trim() === "" ? 0 : parseDollarsToCents(dollars);
    if (cents == null) {
      setError("Enter a monthly amount, like 85.00, or 0.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/beneficiaries/${encodeURIComponent(beneficiaryId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ irweMonthlyCents: cents }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save work expenses.");
      return;
    }
    onSaved();
  }

  return (
    <form
      onSubmit={save}
      className="mb-5 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
    >
      <h2 className="text-[17px] font-bold text-[var(--color-cs-text)]">
        Work expenses (IRWE)
      </h2>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        Out-of-pocket costs you pay so you can work, such as certain transportation,
        adaptive equipment, or medication. This is the monthly amount on the SSA work
        activity report. It is subtracted from earned income before the one-half
        exclusion for SSI, Medicaid, QMB, and Extra Help, and dollar-for-dollar before
        the SSDI substantial-gainful-activity comparison. It is not used for the Trial
        Work Period. SSA decides which receipts qualify. Leave this at 0 if you have none.
      </p>
      <label className="mt-3 block">
        <span className="text-[12px] font-semibold text-[var(--color-cs-text-secondary)]">
          Monthly amount
        </span>
        <input
          inputMode="decimal"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          className="cs-input mt-1"
        />
      </label>
      {error && <p className="mt-2 text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="cs-btn cs-btn-primary mt-3"
      >
        {saving ? "Saving…" : "Save work expenses"}
      </button>
    </form>
  );
}
