"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBuildingBank, IconX } from "@tabler/icons-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { PlaidConnectButton } from "@/components/plaid/plaid-connect-button";

type Beneficiary = {
  _id: string;
  firstName: string;
  lastName: string;
  isOwner: boolean;
};

type Variant = "primary" | "ghost" | "toolbar";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "inline-flex items-center gap-2 rounded-sm bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]",
  ghost:
    "inline-flex items-center gap-2 rounded-sm border border-[var(--color-cs-border)] bg-white px-3 py-2 text-[13px] text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]",
  toolbar:
    "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]",
};

export function PlaidConnectModal({
  primaryBeneficiaryId,
  variant = "primary",
  label = "Connect bank",
  className,
}: {
  primaryBeneficiaryId: string | null;
  variant?: Variant;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(primaryBeneficiaryId);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingList(true);
    setListError(null);
    (async () => {
      const res = await fetch("/api/beneficiaries");
      const data = (await res.json().catch(() => ({}))) as {
        beneficiaries?: Beneficiary[];
        error?: string;
      };
      if (cancelled) return;
      setLoadingList(false);
      if (!res.ok) {
        setListError(data.error ?? "Could not load beneficiaries");
        return;
      }
      const list = data.beneficiaries ?? [];
      setBeneficiaries(list);
      if (!selectedId) {
        const fallback =
          list.find((b) => b.isOwner)?._id ?? list[0]?._id ?? null;
        setSelectedId(fallback);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onConnected = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? VARIANT_CLASS[variant]}
      >
        <IconBuildingBank size={16} stroke={1.5} aria-hidden />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plaid-connect-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-md bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-[var(--color-cs-border)] bg-[var(--color-cs-brand)] px-4 py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-white p-1 shadow-[0_2px_10px_rgba(0,0,0,0.25)] ring-2 ring-white/35"
                  aria-hidden
                >
                  <BrandMark size="lg" />
                </span>
                <h2 id="plaid-connect-title" className="truncate text-[15px] font-semibold tracking-tight">
                  Connect a bank
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-sm p-1 text-white/90 hover:bg-white/15"
              >
                <IconX size={16} stroke={1.5} />
              </button>
            </header>

            <div className="space-y-4 px-5 py-5">
              <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                Plaid gives MyBenefitsPA read-only access to balances and transactions. We never
                see your bank credentials and can&apos;t move money.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-[#c7e0c7] bg-[var(--color-cs-success-bg)] p-3">
                  <p className="text-[11px] font-medium text-[#0e5e0e]">We can see</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-[#143b14]">
                    <li>Balances</li>
                    <li>Transactions</li>
                  </ul>
                </div>
                <div className="rounded border border-[#f0c4c7] bg-[var(--color-cs-danger-bg)] p-3">
                  <p className="text-[11px] font-medium text-[#8e2024]">We never see</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-[#4a1417]">
                    <li>Username/password</li>
                    <li>Funds transfer</li>
                  </ul>
                </div>
              </div>

              {beneficiaries.length > 1 && (
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                    Link to beneficiary
                  </span>
                  <select
                    value={selectedId ?? ""}
                    onChange={(e) => setSelectedId(e.target.value || null)}
                    className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[13px]"
                  >
                    {beneficiaries.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.firstName} {b.lastName}
                        {b.isOwner ? " (you)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {listError && (
                <p className="text-xs text-[var(--color-cs-danger)]">{listError}</p>
              )}

              {loadingList && !selectedId ? (
                <p className="text-center text-xs text-[var(--color-cs-text-secondary)]">
                  Preparing secure connection…
                </p>
              ) : selectedId ? (
                <PlaidConnectButton beneficiaryId={selectedId} onConnected={onConnected} />
              ) : (
                <p className="text-center text-xs text-[var(--color-cs-text-secondary)]">
                  Add a beneficiary profile first to link a bank.
                </p>
              )}

              <p className="text-center text-[11px] text-[var(--color-cs-text-muted)]">
                You can disconnect a bank anytime from Accounts.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
