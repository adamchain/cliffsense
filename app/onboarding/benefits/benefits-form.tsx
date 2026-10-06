"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { programLabel } from "@/lib/benefits/program-meta";
import {
  enrollmentsFromScreening,
  isChoiceComplete,
  MEDICAID_CATEGORIES,
  SCREENING_ITEMS,
  SCREEN_STATUSES,
  TRUST_STATUSES,
  type BenefitScreeningState,
  type MedicaidCategory,
  type ScreeningChoice,
} from "@/lib/onboarding/screening";

const BENEFIT_LABEL: Record<(typeof SCREEN_STATUSES)[number], string> = {
  current: "Current",
  possible: "Possible",
  no: "No",
  unknown: "Unknown",
};

const ACCOUNT_LABEL: Record<(typeof TRUST_STATUSES)[number], string> = {
  exists: "Exists",
  possible: "Possible",
  no: "No",
  unknown: "Unknown",
};

export function BenefitsForm({ accountType }: { accountType: string; programs?: readonly string[] }) {
  const router = useRouter();
  const { update } = useSession();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ScreeningChoice>>({});
  const [medicaidCategory, setMedicaidCategory] = useState<MedicaidCategory | "">("");
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"screen" | "renewals">("screen");
  const [renewals, setRenewals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = SCREENING_ITEMS[index];
  const choice = item ? answers[item.id] : undefined;
  const statuses = item?.kind === "account" ? TRUST_STATUSES : SCREEN_STATUSES;
  const canContinue = item ? isChoiceComplete(item, choice, medicaidCategory) : false;
  const isLast = index === SCREENING_ITEMS.length - 1;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json().catch(() => ({}));
      const list =
        (
          data as {
            beneficiaries?: {
              _id: string;
              isOwner?: boolean;
              opening?: { benefitScreening?: Record<string, ScreeningChoice>; medicaidCategory?: string };
            }[];
          }
        ).beneficiaries ?? [];
      const primary =
        accountType === "beneficiary"
          ? list.find((b) => b.isOwner) ?? list[0]
          : list.find((b) => !b.isOwner) ?? list[0];
      if (!primary) {
        setError("No beneficiary profile found. Complete the identity step first.");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setBeneficiaryId(primary._id);
      const prior = primary.opening?.benefitScreening ?? {};
      setAnswers(prior);
      const cat = primary.opening?.medicaidCategory;
      if (cat === "abd" || cat === "magi" || cat === "unknown") setMedicaidCategory(cat);
      const firstUnanswered = SCREENING_ITEMS.findIndex((it) => !prior[it.id]);
      setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accountType]);

  function enrolledRows(nextAnswers: Record<string, ScreeningChoice>, category: MedicaidCategory | "") {
    const screening: BenefitScreeningState = { answers: nextAnswers, medicaidCategory: category };
    return enrollmentsFromScreening(screening);
  }

  async function persist(
    nextAnswers: Record<string, ScreeningChoice>,
    category: MedicaidCategory | "",
    enroll: boolean,
    renewalDates?: Record<string, string>,
  ) {
    if (!beneficiaryId) return false;
    const rows = enrolledRows(nextAnswers, category).map((row) => ({
      ...row,
      nextRenewalDate: renewalDates?.[row.program] || null,
    }));
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opening: {
          benefitScreening: nextAnswers,
          medicaidCategory: category,
        },
        ...(enroll ? { benefitsEnrolled: rows } : {}),
      }),
    });
    return res.ok;
  }

  async function activateAndAdvance() {
    if (beneficiaryId) {
      await fetch("/api/beneficiaries/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId }),
      });
    }
    const me = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "plaid" }),
    });
    if (!me.ok) {
      setError("Saved programs but could not advance onboarding.");
      setSaving(false);
      return;
    }
    await update({ onboardingStep: "plaid" });
    router.push("/onboarding/plaid");
    router.refresh();
    setSaving(false);
  }

  async function goNext() {
    if (!item || !canContinue) return;
    setSaving(true);
    setError(null);
    const rows = enrolledRows(answers, medicaidCategory);
    const ok = await persist(answers, medicaidCategory, false);
    if (!ok) {
      setError("Could not save this answer.");
      setSaving(false);
      return;
    }
    if (!isLast) {
      setIndex((i) => i + 1);
      setSaving(false);
      return;
    }
    if (rows.length > 0) {
      setPhase("renewals");
      setSaving(false);
      return;
    }
    const enrolled = await persist(answers, medicaidCategory, true);
    if (!enrolled) {
      setError("Could not save programs.");
      setSaving(false);
      return;
    }
    await activateAndAdvance();
  }

  async function saveRenewals() {
    setSaving(true);
    setError(null);
    const ok = await persist(answers, medicaidCategory, true, renewals);
    if (!ok) {
      setError("Could not save renewal dates.");
      setSaving(false);
      return;
    }
    await activateAndAdvance();
  }

  if (loading) {
    return <p className="mt-8 text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>;
  }

  if (phase === "renewals") {
    const rows = enrolledRows(answers, medicaidCategory);
    return (
      <div className="space-y-4">
        <div className="cs-card space-y-4 p-6 md:p-7">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-[var(--color-cs-text)]">Renewal dates</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Enter the next renewal or recertification date from each notice. Leave a date blank if you do not have it yet.
            </p>
          </div>
          {rows.map((row) => (
            <div key={row.program} className="flex flex-col gap-1.5">
              <label className="cs-label" htmlFor={`renew-${row.program}`}>
                {programLabel(row.program)}
              </label>
              <input
                id={`renew-${row.program}`}
                type="date"
                value={renewals[row.program] ?? ""}
                onChange={(e) =>
                  setRenewals((prev) => ({ ...prev, [row.program]: e.target.value }))
                }
                className="cs-input"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
        <div className="flex justify-between">
          <button
            type="button"
            className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline"
            onClick={() => setPhase("screen")}
          >
            Back
          </button>
          <button
            type="button"
            disabled={saving}
            className="cs-btn cs-btn-primary"
            onClick={() => void saveRenewals()}
          >
            {saving ? "Saving…" : "Continue to bank"}
          </button>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const pct = Math.round(((index + (canContinue ? 1 : 0)) / SCREENING_ITEMS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="cs-card space-y-4 p-6 md:p-7">
        <div>
          <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            <span>
              Program {index + 1} of {SCREENING_ITEMS.length}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-cs-input-bg)]" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--color-cs-brand)] transition-[width]"
              style={{ width: `${((index + 1) / SCREENING_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-[var(--color-cs-text)]">{item.program}</h2>
          <div className="mt-3 rounded-xl border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-brand)]">
              Document to keep
            </p>
            <p className="mt-1 text-[14px] font-semibold leading-snug text-[var(--color-cs-text)]">{item.vault}</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            <span className="font-semibold text-[var(--color-cs-text)]">Who to screen. </span>
            {item.who}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            <span className="font-semibold text-[var(--color-cs-text)]">What confirms it. </span>
            {item.confirms}
          </p>
          {item.note ? (
            <p className="mt-3 rounded-xl border border-[var(--color-cs-warning)]/30 bg-[var(--color-cs-warning-bg)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-cs-text)]">
              {item.note}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((s) => {
            const selected = choice === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: s }))}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  selected
                    ? "border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                    : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)]/55"
                }`}
              >
                {item.kind === "account"
                  ? ACCOUNT_LABEL[s as (typeof TRUST_STATUSES)[number]]
                  : BENEFIT_LABEL[s as (typeof SCREEN_STATUSES)[number]]}
              </button>
            );
          })}
        </div>
        {item.id === "medicaid" && choice === "current" ? (
          <div className="space-y-2">
            <p className="cs-label">Exact Medical Assistance category</p>
            {MEDICAID_CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-[13px] ${
                  medicaidCategory === c.id
                    ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)]"
                    : "border-[var(--color-cs-border)]"
                }`}
              >
                <input
                  type="radio"
                  name="medicaid-cat"
                  className="mt-0.5 accent-[var(--color-cs-brand)]"
                  checked={medicaidCategory === c.id}
                  onChange={() => setMedicaidCategory(c.id)}
                />
                {c.label}
              </label>
            ))}
          </div>
        ) : null}
      </div>
      {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-between">
        <button
          type="button"
          className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline disabled:opacity-40"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        <button
          type="button"
          disabled={saving || !canContinue}
          className="cs-btn cs-btn-primary"
          onClick={() => void goNext()}
        >
          {saving
            ? "Saving…"
            : isLast && enrolledRows(answers, medicaidCategory).length > 0
              ? "Renewal dates"
              : isLast
                ? "Continue to bank"
                : "Continue"}
        </button>
      </div>
    </div>
  );
}
