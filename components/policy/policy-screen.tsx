"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AlertPlaybookPanel } from "@/components/alerts/alert-playbook-panel";
import { MedicaidWorkRequirements } from "@/components/benefits/medicaid-work-requirements";
import { playbookById } from "@/lib/alerts/alert-playbook";
import {
  EMPTY_POLICY_ANSWERS,
  MAGI_EXEMPTION_OPTIONS,
  evaluatePolicyScreen,
  type ImmigrationCategory,
  type PolicyScreenAnswers,
  type ScreenResult,
} from "@/lib/policy/screen";

type Tab = "snap" | "magi" | "immigrant";

function numOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function PolicyScreen({
  beneficiaryId,
  initial,
}: {
  beneficiaryId?: string | null;
  initial?: Partial<PolicyScreenAnswers>;
}) {
  const [tab, setTab] = useState<Tab>("snap");
  const [answers, setAnswers] = useState<PolicyScreenAnswers>({
    ...EMPTY_POLICY_ANSWERS,
    ...initial,
  });
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : "");
  const [childAge, setChildAge] = useState(
    initial?.youngestChildAge != null ? String(initial.youngestChildAge) : "",
  );
  const [hours, setHours] = useState(initial?.magiHours != null ? String(initial.magiHours) : "");
  const [saveState, setSaveState] = useState<string | null>(null);

  const computed: PolicyScreenAnswers = {
    ...answers,
    age: numOrNull(age),
    youngestChildAge: numOrNull(childAge),
    magiHours: numOrNull(hours),
  };
  const computedKey = JSON.stringify(computed);
  const results = useMemo(
    () => evaluatePolicyScreen(JSON.parse(computedKey) as PolicyScreenAnswers),
    [computedKey],
  );

  const onTotalHours = useCallback((n: number) => {
    setHours((prev) => {
      const next = n === 0 ? "" : String(Math.round(n * 10) / 10);
      return prev === next ? prev : next;
    });
  }, []);

  async function save() {
    if (!beneficiaryId) return;
    setSaveState("Saving…");
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyScreen: computed }),
    });
    setSaveState(res.ok ? "Saved on this profile" : "Could not save");
  }

  const active = results[tab];

  return (
    <section className="mt-10">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">
        2026–2027 policy screen
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        SNAP work-rule expansion, MAGI hours, and immigrant-category restrictions from the
        market-strategy deck. Every rule is <span className="font-medium text-[var(--color-cs-text)]">unverified</span>{" "}
        until Pennsylvania’s effective date, waivers, and notice language are confirmed. This is not
        a compliance determination.
      </p>

      <div className="mt-3 inline-flex rounded-[10px] bg-[rgba(118,118,128,0.12)] p-0.5" role="tablist">
        {(
          [
            ["snap", "SNAP work rules"],
            ["magi", "MAGI 2027"],
            ["immigrant", "Immigration"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold ${
              tab === id ? "bg-white text-[var(--color-cs-text)] shadow-sm" : "text-[var(--color-cs-text-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded border border-[var(--color-cs-border)] bg-white p-4">
          {tab === "snap" && (
            <>
              <Field label="Age">
                <input className="cs-input mt-1.5" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </Field>
              <Field label="Youngest child’s age (blank if none)">
                <input
                  className="cs-input mt-1.5"
                  inputMode="numeric"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                />
              </Field>
              <Toggle
                label="Veteran"
                checked={answers.veteran}
                onChange={(v) => setAnswers((a) => ({ ...a, veteran: v }))}
              />
              <Toggle
                label="Former foster youth"
                checked={answers.formerFosterYouth}
                onChange={(v) => setAnswers((a) => ({ ...a, formerFosterYouth: v }))}
              />
              <Toggle
                label="Pregnant"
                checked={answers.pregnant}
                onChange={(v) => setAnswers((a) => ({ ...a, pregnant: v }))}
              />
              <Toggle
                label="Disability or medical condition limits work (even without benefits)"
                checked={answers.disabilityLimitsWork}
                onChange={(v) => setAnswers((a) => ({ ...a, disabilityLimitsWork: v }))}
              />
              <Toggle
                label="Caring for an incapacitated person"
                checked={answers.caregiverIncapacitated}
                onChange={(v) => setAnswers((a) => ({ ...a, caregiverIncapacitated: v }))}
              />
            </>
          )}
          {tab === "magi" && (
            <>
              <Field label="Age (MAGI hours described for 19–64)">
                <input className="cs-input mt-1.5" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </Field>
              <MedicaidWorkRequirements
                embedded
                initialHours={initial?.magiHours}
                onTotalHours={onTotalHours}
              />
              <p className="text-[12px] font-medium text-[var(--color-cs-text)]">Claimed MAGI exemptions</p>
              {MAGI_EXEMPTION_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.id}
                  label={opt.label}
                  checked={answers.magiExemptionIds.includes(opt.id)}
                  onChange={(v) =>
                    setAnswers((a) => ({
                      ...a,
                      magiExemptionIds: v
                        ? [...a.magiExemptionIds, opt.id]
                        : a.magiExemptionIds.filter((id) => id !== opt.id),
                    }))
                  }
                />
              ))}
            </>
          )}
          {tab === "immigrant" && (
            <>
              <Field label="Immigration category (as you understand it)">
                <select
                  className="cs-input mt-1.5"
                  value={answers.immigrationCategory}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      immigrationCategory: e.target.value as ImmigrationCategory,
                    }))
                  }
                >
                  <option value="unknown">Not sure yet</option>
                  <option value="us_citizen">U.S. citizen</option>
                  <option value="lpr">Lawful permanent resident</option>
                  <option value="refugee_asylee">Refugee or asylee</option>
                  <option value="parole_other_lawful">Other lawfully present (parole, EAD, etc.)</option>
                  <option value="undocumented">No current lawful status</option>
                </select>
              </Field>
              <Toggle
                label="Received a notice that Medicaid or SNAP will close because of 2026 immigrant rules"
                checked={answers.receivedImmigrantNotice}
                onChange={(v) => setAnswers((a) => ({ ...a, receivedImmigrantNotice: v }))}
              />
            </>
          )}
          {beneficiaryId && (
            <button type="button" className="cs-btn cs-btn-secondary text-[12px]" onClick={() => void save()}>
              Save answers on this profile
            </button>
          )}
          {saveState && <p className="text-[12px] text-[var(--color-cs-text-secondary)]">{saveState}</p>}
        </div>

        <ResultCard result={active} />
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[13px]">
      <span className="cs-label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-[13px] text-[var(--color-cs-text)]">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ResultCard({ result }: { result: ScreenResult }) {
  const playbook = playbookById(result.playbookId);
  return (
    <div className="rounded border border-[var(--color-cs-border)] bg-white p-4">
      <p className="rounded-md bg-[#fff4ce] px-3 py-2 text-[12px] leading-relaxed text-[#8a5400]">
        {result.gateLabel}
      </p>
      <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-cs-text)]">{result.headline}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">{result.detail}</p>
      {result.flags.length > 0 && (
        <ul className="mt-3 space-y-2">
          {result.flags.map((f) => (
            <li key={f.id} className="text-[12px] leading-snug">
              <span className="font-semibold text-[var(--color-cs-text)]">{f.label}</span>
              <span className="text-[var(--color-cs-text-muted)]"> · {f.status.replace("_", " ")}</span>
              <p className="text-[var(--color-cs-text-secondary)]">{f.note}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        Documents if this rule ever applies
      </p>
      <ul className="mt-1 list-disc pl-4 text-[12px] text-[var(--color-cs-text-secondary)]">
        {result.documents.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      {playbook && <AlertPlaybookPanel playbook={playbook} />}
    </div>
  );
}
