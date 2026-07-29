"use client";

import { useMemo, useState } from "react";
import {
  estimateSsiWithSntPayment,
  presumedMaxValueCents,
  SSI_FBR_INDIVIDUAL_CENTS,
  SSI_FBR_COUPLE_CENTS,
  SSI_FBR_YEAR,
  type SntPaymentType,
} from "@/lib/benefits/ssi";
import { formatPlainUsdFromCents } from "@/lib/format/money";

/* Interactive estimator that surfaces lib/benefits/ssi.ts in the product: enter a
 * Special Needs Trust payment and see the estimated SSI impact for the month.
 * Informational — mirrors SSA's cash / ISM(PMV) / excluded rules for 2026. */

const PAYMENT_OPTIONS: { value: SntPaymentType; label: string; hint: string }[] = [
  { value: "cash", label: "Cash to the beneficiary", hint: "Counts dollar-for-dollar" },
  { value: "shelter", label: "Shelter paid to a vendor", hint: "Rent, mortgage, taxes, utilities" },
  { value: "food_nonshelter", label: "Food / other paid to a vendor", hint: "Groceries, internet, phone, cable, tuition…" },
];

function dollarsToCents(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export function SntEstimator({ compact }: { compact?: boolean } = {}) {
  const [paymentType, setPaymentType] = useState<SntPaymentType>("shelter");
  const [amount, setAmount] = useState("1500");
  const [otherUnearned, setOtherUnearned] = useState("");
  const [couple, setCouple] = useState(false);

  const fbrCents = couple ? SSI_FBR_COUPLE_CENTS : SSI_FBR_INDIVIDUAL_CENTS;

  const result = useMemo(
    () =>
      estimateSsiWithSntPayment({
        paymentType,
        amountCents: dollarsToCents(amount),
        otherUnearnedCents: dollarsToCents(otherUnearned),
        fbrCents,
      }),
    [paymentType, amount, otherUnearned, fbrCents],
  );

  return (
    <section className={compact ? "mt-2" : "mt-8"}>
      {!compact ? (
        <>
          <h2 className="text-base font-medium text-[var(--color-cs-text)]">
            Effect of payments coming from an SNT — {SSI_FBR_YEAR}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Estimate how a single trust distribution affects the monthly SSI check. Informational only — real cases
            also turn on living arrangement, deeming, and any state supplement.
          </p>
        </>
      ) : null}

      <div className="mt-3 grid gap-4 rounded border border-[var(--color-cs-border)] bg-white p-4 sm:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
              How is the payment made?
            </label>
            <div className="mt-1.5 space-y-1.5">
              {PAYMENT_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-[13px] ${
                    paymentType === o.value
                      ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)]"
                      : "border-[var(--color-cs-border)] hover:bg-[var(--color-cs-surface)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="sntPaymentType"
                    className="mt-0.5"
                    checked={paymentType === o.value}
                    onChange={() => setPaymentType(o.value)}
                  />
                  <span>
                    <span className="font-medium text-[var(--color-cs-text)]">{o.label}</span>
                    <span className="block text-[11px] text-[var(--color-cs-text-muted)]">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <label className="flex-1 text-[12px] text-[var(--color-cs-text-secondary)]">
              Payment amount
              <div className="mt-0.5 flex items-center rounded-sm border border-[var(--color-cs-border)] bg-white px-2">
                <span className="text-[13px] text-[var(--color-cs-text-muted)]">$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-8 w-full bg-transparent px-1 text-[13px] outline-none"
                  placeholder="1500"
                />
              </div>
            </label>
            <label className="flex-1 text-[12px] text-[var(--color-cs-text-secondary)]">
              Other unearned income
              <div className="mt-0.5 flex items-center rounded-sm border border-[var(--color-cs-border)] bg-white px-2">
                <span className="text-[13px] text-[var(--color-cs-text-muted)]">$</span>
                <input
                  inputMode="decimal"
                  value={otherUnearned}
                  onChange={(e) => setOtherUnearned(e.target.value)}
                  className="h-8 w-full bg-transparent px-1 text-[13px] outline-none"
                  placeholder="0"
                />
              </div>
            </label>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[var(--color-cs-text-secondary)]">
            <input type="checkbox" checked={couple} onChange={(e) => setCouple(e.target.checked)} />
            Use the eligible-couple FBR ({formatPlainUsdFromCents(SSI_FBR_COUPLE_CENTS)}/mo)
          </label>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-between rounded-md bg-[var(--color-cs-surface)] p-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-muted)]">
              Estimated SSI check this month
            </p>
            <p className="mt-1 text-[26px] font-bold tabular-nums text-[var(--color-cs-text)]">
              {formatPlainUsdFromCents(result.ssiCents)}
            </p>
            <dl className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-cs-text-secondary)]">Federal Benefit Rate</dt>
                <dd className="font-medium tabular-nums">{formatPlainUsdFromCents(result.fbrCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-cs-text-secondary)]">Counted as income</dt>
                <dd className="font-medium tabular-nums">{formatPlainUsdFromCents(result.countedValueCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-cs-text-secondary)]">Reduction from this payment</dt>
                <dd className="font-medium tabular-nums text-[var(--color-cs-danger)]">
                  {result.reductionCents > 0 ? `− ${formatPlainUsdFromCents(result.reductionCents)}` : "$0.00"}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--color-cs-border)] pt-1.5">
                <dt className="text-[var(--color-cs-text-secondary)]">Presumed Maximum Value (cap)</dt>
                <dd className="font-medium tabular-nums">{formatPlainUsdFromCents(presumedMaxValueCents(fbrCents))}</dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-[var(--color-cs-text-muted)]">{result.note}</p>
        </div>
      </div>
    </section>
  );
}
