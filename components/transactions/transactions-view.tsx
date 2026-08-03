"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  IconBriefcase,
  IconBuildingBank,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconHelpCircle,
  IconPaperclip,
  IconReceipt,
  IconRefresh,
  IconShieldCheck,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatShortDate, formatSignedUsd, isInflowCents } from "@/lib/format/money";
import { AccountsPanel, type AccountConnection } from "@/components/transactions/accounts-panel";
import { ImportModal } from "@/components/imports/import-modal";

type UserCategory =
  | "earned_income"
  | "benefit_deposit"
  | "other_income"
  | "expense"
  | "transfer"
  | "unclear";

type TxRow = {
  _id: string;
  date: string;
  name: string;
  merchantName: string;
  category: string;
  pfcPrimary?: string;
  pfcDetailed?: string;
  amountCents: number;
  pending: boolean;
  userCategory: UserCategory;
  suggestedUserCategory?: UserCategory | null;
  excludedFromThresholds?: boolean;
  receiptDocumentId?: string | null;
};

type ApplyAllPrompt = {
  sourceId: string;
  userCategory: UserCategory;
  label: string;
  count: number;
};

const FILTER_CHIPS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "inflow", label: "Income" },
  { id: "benefit_deposit", label: "Benefits" },
  { id: "outflow", label: "Expenses" },
  { id: "unclear", label: "Needs review" },
];

const CATEGORY_LABEL: Record<UserCategory, string> = {
  earned_income: "Earned income",
  benefit_deposit: "Benefit deposit",
  other_income: "Other income",
  expense: "Expense",
  transfer: "Transfer",
  unclear: "Needs review",
};

function badgeClass(cat: UserCategory): string {
  switch (cat) {
    case "earned_income":
      return "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]";
    case "benefit_deposit":
      return "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-info)]";
    case "unclear":
      return "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]";
    case "expense":
      return "bg-[var(--color-cs-fill)] text-[var(--color-cs-text-secondary)]";
    default:
      return "bg-[var(--color-cs-fill)] text-[var(--color-cs-text-secondary)]";
  }
}

function CategoryIcon({ cat }: { cat: UserCategory }) {
  if (cat === "earned_income") return <IconBriefcase size={12} aria-hidden />;
  if (cat === "benefit_deposit") return <IconShieldCheck size={12} aria-hidden />;
  if (cat === "unclear") return <IconHelpCircle size={12} aria-hidden />;
  return null;
}

function RowReceipt({
  docId,
  onAdd,
  disabled,
}: {
  docId?: string | null;
  onAdd: () => void;
  disabled: boolean;
}) {
  if (docId) {
    return (
      <a
        href={`/vault/${docId}`}
        className="inline-flex items-center gap-1 rounded-full bg-[var(--color-cs-success-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-cs-success)]"
      >
        <IconReceipt size={12} stroke={1.8} aria-hidden /> Receipt
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-cs-fill)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-cs-text-secondary)] disabled:opacity-50"
    >
      <IconPaperclip size={12} stroke={1.8} aria-hidden /> Add receipt
    </button>
  );
}

export function TransactionsView({
  beneficiaryId,
  connections = [],
}: {
  beneficiaryId: string | null;
  connections?: AccountConnection[];
}) {
  const [filter, setFilter] = useState("all");
  const [showAccounts, setShowAccounts] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [total, setTotal] = useState(0);
  const [unclearTotal, setUnclearTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [applyingPlaid, setApplyingPlaid] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [applyPrompt, setApplyPrompt] = useState<ApplyAllPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const receiptTargetRef = useRef<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptMsg, setReceiptMsg] = useState<string | null>(null);

  function pickReceipt(transactionId: string | null) {
    if (uploadingReceipt) return;
    receiptTargetRef.current = transactionId;
    receiptInputRef.current?.click();
  }

  async function onReceiptFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !beneficiaryId) return;
    const targetId = receiptTargetRef.current;
    setUploadingReceipt(true);
    setReceiptMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("beneficiaryId", beneficiaryId);
    fd.append("category", "receipts");
    if (targetId) fd.append("transactionId", targetId);
    const res = await fetch("/api/vault/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploadingReceipt(false);
    if (!res.ok) {
      setReceiptMsg((data as { error?: string }).error ?? "Receipt upload failed");
      return;
    }
    const docId = (data as { document?: { id?: string } }).document?.id ?? null;
    if (targetId && docId) {
      setRows((prev) => prev.map((r) => (r._id === targetId ? { ...r, receiptDocumentId: docId } : r)));
      setReceiptMsg("Receipt attached and saved to Vault › Receipts.");
    } else {
      setReceiptMsg("Receipt saved to Vault › Receipts.");
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      beneficiaryId,
      page: String(page),
      limit: String(limit),
    });
    if (filter !== "all") params.set("filter", filter);
    if (debouncedQ) params.set("q", debouncedQ);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Failed to load");
      return;
    }
    setRows((data as { transactions: TxRow[] }).transactions ?? []);
    setTotal((data as { total: number }).total ?? 0);
  }, [beneficiaryId, page, filter, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshUnclear = useCallback(async () => {
    if (!beneficiaryId) return;
    const params = new URLSearchParams({
      beneficiaryId,
      filter: "unclear",
      page: "1",
      limit: "1",
    });
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setUnclearTotal((data as { total: number }).total ?? 0);
  }, [beneficiaryId]);

  useEffect(() => {
    void refreshUnclear();
  }, [refreshUnclear]);

  // One-shot: upgrade payroll stuck as unclear/transfer from prior imports.
  useEffect(() => {
    if (!beneficiaryId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/transactions/apply-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId }),
      }).catch(() => null);
      if (cancelled || !res?.ok) return;
      const data = (await res.json().catch(() => ({}))) as { updated?: number };
      if ((data.updated ?? 0) > 0) {
        await load();
        await refreshUnclear();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per beneficiary
  }, [beneficiaryId]);

  async function applyPlaidSuggestions() {
    if (!beneficiaryId) return;
    setApplyingPlaid(true);
    setError(null);
    const res = await fetch("/api/transactions/apply-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId }),
    });
    const data = await res.json().catch(() => ({}));
    setApplyingPlaid(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Could not apply categories");
      return;
    }
    setPage(1);
    await load();
    await refreshUnclear();
  }

  async function checkSimilar(id: string, userCategory: UserCategory) {
    const res = await fetch(
      `/api/transactions/${id}/similar?userCategory=${encodeURIComponent(userCategory)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const count = (data as { count?: number }).count ?? 0;
    const label = (data as { match?: { label?: string } | null }).match?.label;
    if (count > 0 && label) {
      setApplyPrompt({ sourceId: id, userCategory, label, count });
    } else {
      setApplyPrompt(null);
    }
  }

  useEffect(() => {
    if (!applyPrompt) return;
    const el = document.getElementById(`tx-apply-${applyPrompt.sourceId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [applyPrompt]);

  async function patchCategory(id: string, userCategory: UserCategory) {
    const prev = rows.find((r) => r._id === id)?.userCategory;
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCategory }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { transaction: TxRow };
    setRows((prevRows) => prevRows.map((r) => (r._id === id ? { ...r, ...data.transaction } : r)));
    void refreshUnclear();
    if (prev !== userCategory && userCategory !== "unclear") {
      void checkSimilar(id, userCategory);
    } else {
      setApplyPrompt(null);
    }
  }

  async function applyToSimilar() {
    if (!applyPrompt) return;
    setApplyingBulk(true);
    const res = await fetch("/api/transactions/bulk-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTransactionId: applyPrompt.sourceId,
        userCategory: applyPrompt.userCategory,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setApplyingBulk(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Could not update similar transactions");
      return;
    }
    setApplyPrompt(null);
    await load();
    await refreshUnclear();
  }

  async function patchExcluded(id: string, excludedFromThresholds: boolean) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedFromThresholds }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { transaction: TxRow };
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...data.transaction } : r)));
  }

  async function runSync() {
    if (!beneficiaryId) return;
    setSyncing(true);
    setError(null);
    const res = await fetch("/api/plaid/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId }),
    });
    setSyncing(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Sync failed");
      return;
    }
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const chips = useMemo(() => {
    return FILTER_CHIPS.map((c) => {
      let label = c.label;
      if (c.id === "unclear" && unclearTotal != null) {
        label = `${c.label} (${unclearTotal})`;
      }
      return { ...c, label };
    });
  }, [unclearTotal]);

  if (!beneficiaryId) {
    return (
      <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile first.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Continue onboarding
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="cs-big-title">Money</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="cs-circbtn !h-9 !w-9"
            aria-label={syncing ? "Syncing" : "Sync banks"}
            onClick={() => void runSync()}
            disabled={syncing}
          >
            <IconRefresh size={17} stroke={2} className={syncing ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            className="cs-circbtn !h-9 !w-9"
            aria-label="Add receipt"
            onClick={() => pickReceipt(null)}
            disabled={uploadingReceipt}
          >
            <IconReceipt size={17} stroke={2} />
          </button>
          <ImportModal
            beneficiaryId={beneficiaryId}
            variant="toolbar"
            label="Import"
            onImported={() => void load()}
          />
          <Link href="/reports" className="cs-circbtn !h-9 !w-9" aria-label="Export">
            <IconDownload size={17} stroke={2} />
          </Link>
        </div>
      </div>
      <p className="mb-4 text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Categorize deposits so limits stay accurate. Mark earned income and we&apos;ll offer to apply
        it to matching payors from the same bank.
      </p>

      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onReceiptFile}
        aria-hidden
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAccounts((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-[14px] px-3 py-1.5 text-[13px] font-semibold ${
            showAccounts
              ? "bg-[var(--color-cs-brand)] text-white"
              : "bg-[var(--color-cs-card)] text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          }`}
        >
          <IconBuildingBank size={15} stroke={1.8} />
          Accounts{connections.length ? ` (${connections.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => void applyPlaidSuggestions()}
          disabled={applyingPlaid}
          className="inline-flex items-center gap-1.5 rounded-[14px] bg-[var(--color-cs-card)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50"
        >
          <IconTag size={15} stroke={1.8} />
          {applyingPlaid ? "Applying…" : "Apply Plaid categories"}
        </button>
      </div>

      {showAccounts && (
        <AccountsPanel beneficiaryId={beneficiaryId} connections={connections} />
      )}

      <div
        className="mb-3 inline-flex flex-wrap rounded-[10px] bg-[rgba(118,118,128,0.12)] p-0.5"
        role="group"
        aria-label="Transaction filter"
      >
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setFilter(c.id);
              setPage(1);
            }}
            className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition ${
              filter === c.id
                ? "bg-white text-[var(--color-cs-text)] shadow-sm"
                : "text-[var(--color-cs-text-secondary)]"
            }`}
            aria-pressed={filter === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <input
          type="search"
          placeholder="Search description, merchant, or category"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="cs-input max-w-md"
        />
      </div>

      {error && (
        <p className="mb-3 text-xs text-[var(--color-cs-danger)]" role="alert">
          {error}
        </p>
      )}

      {receiptMsg && (
        <p className="mb-3 flex items-center gap-1.5 text-[13px] text-[var(--color-cs-success)]">
          <IconReceipt size={14} stroke={1.8} aria-hidden />
          {receiptMsg}
        </p>
      )}

      <div className="mb-2 flex items-baseline justify-between px-0.5">
        <h2 className="text-[22px] font-bold tracking-tight">Transactions</h2>
        <span className="text-[13px] text-[var(--color-cs-text-secondary)]">
          {showingFrom}–{showingTo} of {total}
        </span>
      </div>

      <div className="space-y-2.5">
        {loading && rows.length === 0 && (
          <div className="rounded-[18px] bg-[var(--color-cs-card)] px-4 py-8 text-center text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            Loading…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rounded-[18px] bg-[var(--color-cs-card)] px-4 py-8 text-center text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            No transactions yet. Connect a bank and tap sync, or widen your filters.
          </div>
        )}
        {rows.map((r) => {
          const inflow = isInflowCents(r.amountCents);
          const highlightUnclear = r.userCategory === "unclear";
          const excluded = Boolean(r.excludedFromThresholds);
          const countsTowardEarned = r.userCategory === "earned_income" && !r.pending;
          const showApply = applyPrompt?.sourceId === r._id;
          return (
            <div key={r._id} className="space-y-2">
            <article
              className={`rounded-[18px] bg-[var(--color-cs-card)] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                highlightUnclear ? "ring-1 ring-[var(--color-cs-warning)]/35" : ""
              } ${excluded && countsTowardEarned ? "opacity-80" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-semibold text-[var(--color-cs-text)]">
                    {r.name || "—"}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-cs-text-secondary)]">
                    {[r.merchantName, r.category].filter(Boolean).join(" · ") || "—"}
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--color-cs-text-muted)]">
                    {formatShortDate(r.date)}
                    {r.pending ? " · Pending" : ""}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-right text-[16px] font-semibold tabular-nums ${
                    inflow ? "text-[var(--color-cs-success)]" : "text-[var(--color-cs-text)]"
                  }`}
                >
                  {formatSignedUsd(r.amountCents)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(r.userCategory)}`}
                >
                  <CategoryIcon cat={r.userCategory} />
                  {CATEGORY_LABEL[r.userCategory]}
                </span>
                <select
                  aria-label="Change category"
                  className="cs-input !h-8 !w-auto !min-w-[9.5rem] !py-0 text-[12px]"
                  value={r.userCategory}
                  onChange={(e) => void patchCategory(r._id, e.target.value as UserCategory)}
                >
                  {(Object.keys(CATEGORY_LABEL) as UserCategory[]).map((k) => (
                    <option key={k} value={k}>
                      {CATEGORY_LABEL[k]}
                    </option>
                  ))}
                </select>
                <RowReceipt
                  docId={r.receiptDocumentId}
                  onAdd={() => pickReceipt(r._id)}
                  disabled={uploadingReceipt}
                />
              </div>

              {r.suggestedUserCategory &&
              r.suggestedUserCategory !== r.userCategory &&
              r.suggestedUserCategory !== "unclear" ? (
                <p className="mt-2 text-[11.5px] text-[var(--color-cs-text-muted)]">
                  Suggested:{" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--color-cs-brand)]"
                    onClick={() => void patchCategory(r._id, r.suggestedUserCategory!)}
                  >
                    {CATEGORY_LABEL[r.suggestedUserCategory]}
                  </button>
                </p>
              ) : null}

              {countsTowardEarned && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--color-cs-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={!excluded}
                    onChange={(e) => void patchExcluded(r._id, !e.target.checked)}
                    aria-label="Count this transaction toward earned-income limits"
                  />
                  <span>Count toward limits</span>
                </label>
              )}
            </article>

            {showApply && applyPrompt && (
              <div
                id={`tx-apply-${r._id}`}
                className="flex items-start gap-3 rounded-[18px] bg-[var(--color-cs-brand-soft)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-[var(--color-cs-text)]">
                    Apply to similar transactions?
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
                    We found{" "}
                    <span className="font-semibold text-[var(--color-cs-text)]">
                      {applyPrompt.count}
                    </span>{" "}
                    other {applyPrompt.count === 1 ? "transaction" : "transactions"} from{" "}
                    <span className="font-semibold text-[var(--color-cs-text)]">
                      {applyPrompt.label}
                    </span>{" "}
                    at this bank that aren&apos;t marked{" "}
                    <span className="font-semibold text-[var(--color-cs-text)]">
                      {CATEGORY_LABEL[applyPrompt.userCategory]}
                    </span>
                    .
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={applyingBulk}
                      onClick={() => void applyToSimilar()}
                      className="cs-btn cs-btn-primary disabled:opacity-50"
                    >
                      {applyingBulk ? "Applying…" : `Apply to all ${applyPrompt.count}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyPrompt(null)}
                      className="cs-btn cs-btn-secondary"
                    >
                      Just this one
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="cs-circbtn !h-8 !w-8"
                  aria-label="Dismiss"
                  onClick={() => setApplyPrompt(null)}
                >
                  <IconX size={16} stroke={2} />
                </button>
              </div>
            )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between px-0.5 text-[13px] text-[var(--color-cs-text-secondary)]">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page <= 1}
            className="cs-circbtn !h-9 !w-9 disabled:opacity-40"
            aria-label="Previous page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            className="cs-circbtn !h-9 !w-9 disabled:opacity-40"
            aria-label="Next page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
