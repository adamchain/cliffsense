"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  IconArrowsLeftRight,
  IconBuildingBank,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconDownload,
  IconGasStation,
  IconPaperclip,
  IconReceipt,
  IconRefresh,
  IconShoppingCart,
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
  postedDate?: string;
  name: string;
  merchantName: string;
  category: string;
  pfcPrimary?: string;
  pfcDetailed?: string;
  amountCents: number;
  currency?: string;
  pending: boolean;
  userCategory: UserCategory;
  suggestedUserCategory?: UserCategory | null;
  excludedFromThresholds?: boolean;
  excludeReason?: string;
  notes?: string;
  receiptDocumentId?: string | null;
  bankConnectionId?: string;
  plaidAccountId?: string;
};

type AccountInfo = { institutionName: string; accountName: string; mask: string };

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
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-cs-success)] hover:bg-[var(--color-cs-success-bg)]"
        aria-label="View receipt"
        title="View receipt"
      >
        <IconReceipt size={14} stroke={1.8} aria-hidden />
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-cs-text-muted)] hover:bg-[var(--color-cs-fill)] disabled:opacity-50"
      aria-label="Add receipt"
      title="Add receipt"
    >
      <IconPaperclip size={14} stroke={1.8} aria-hidden />
    </button>
  );
}

const TITLE_LEADS = [
  "Recurring Withdrawal",
  "Withdrawal Debit Card",
  "Debit Card Purchase",
  "Point of Sale",
  "Direct Deposit",
  "ACH Deposit",
  "Check Deposit",
  "Purchase",
  "Deposit",
  "Transfer",
];

function shortTitle(name: string, merchant: string): string {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();
  for (const lead of TITLE_LEADS) {
    if (lower.startsWith(lead.toLowerCase())) return lead;
  }
  const beforeDate = cleaned.split(/\s+date\s+/i)[0]?.trim() ?? cleaned;
  if (beforeDate && beforeDate.length <= 32) return beforeDate;
  if (merchant && merchant.length <= 28) return merchant;
  return (beforeDate || merchant || "—").slice(0, 32).trim();
}

function rowSubtitle(row: TxRow): string {
  const merchant = (row.merchantName ?? "").trim();
  const cats = (row.category ?? "")
    .split(/›|·/)
    .map((part) => part.trim())
    .filter(Boolean);
  return [merchant, ...cats].filter(Boolean).join(" · ");
}

function CategoryMark({ row }: { row: TxRow }) {
  const blob = `${row.pfcPrimary ?? ""} ${row.pfcDetailed ?? ""} ${row.category}`.toUpperCase();
  let bg = "bg-[#f2f2f4] text-[#8e8e93]";
  let Icon = IconCreditCard;
  if (blob.includes("GOVERNMENT") || row.userCategory === "benefit_deposit") {
    bg = "bg-[#e7f8ee] text-[#34a853]";
    Icon = IconBuildingBank;
  } else if (blob.includes("TRANSPORT") || blob.includes("GAS")) {
    bg = "bg-[#fff4dc] text-[#c48a12]";
    Icon = IconGasStation;
  } else if (blob.includes("GROCERY")) {
    bg = "bg-[#f3eefe] text-[#7b61c9]";
    Icon = IconShoppingCart;
  } else if (blob.includes("FOOD") || blob.includes("MERCHANDISE") || blob.includes("CONVENIENCE")) {
    bg = "bg-[#e8f1ff] text-[#3b82c4]";
    Icon = IconShoppingCart;
  } else if (row.userCategory === "earned_income" || row.userCategory === "other_income") {
    bg = "bg-[#e7f8ee] text-[#34a853]";
    Icon = IconBuildingBank;
  } else if (row.userCategory === "transfer") {
    Icon = IconArrowsLeftRight;
  }
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`} aria-hidden>
      <Icon size={16} stroke={1.8} />
    </span>
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
  // "" = all; "conn:<id>" = whole institution; "acct:<plaidAccountId>" = one account.
  const [accountFilter, setAccountFilter] = useState("");
  const [detailRow, setDetailRow] = useState<TxRow | null>(null);
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

  // Resolve a transaction's connection + account to display names. Transactions
  // carry bankConnectionId always and plaidAccountId when the sync captured it.
  const { connById, acctByPlaidId } = useMemo(() => {
    const conn = new Map<string, string>();
    const acct = new Map<string, AccountInfo>();
    for (const c of connections) {
      conn.set(c.id, c.institutionName);
      for (const a of c.accounts) {
        if (a.plaidAccountId) {
          acct.set(a.plaidAccountId, {
            institutionName: c.institutionName,
            accountName: a.name,
            mask: a.mask,
          });
        }
      }
    }
    return { connById: conn, acctByPlaidId: acct };
  }, [connections]);

  const accountInfoForRow = useCallback(
    (r: TxRow): AccountInfo | null => {
      if (r.plaidAccountId && acctByPlaidId.has(r.plaidAccountId)) {
        return acctByPlaidId.get(r.plaidAccountId)!;
      }
      if (r.bankConnectionId && connById.has(r.bankConnectionId)) {
        return { institutionName: connById.get(r.bankConnectionId)!, accountName: "", mask: "" };
      }
      return null;
    },
    [acctByPlaidId, connById],
  );

  // Flat list of selectable accounts for the filter: each institution, then
  // each of its known accounts.
  const hasMultipleAccounts = useMemo(
    () => connections.reduce((n, c) => n + Math.max(1, c.accounts.length), 0) > 1,
    [connections],
  );

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
    if (accountFilter.startsWith("conn:")) params.set("connectionId", accountFilter.slice(5));
    else if (accountFilter.startsWith("acct:")) params.set("accountId", accountFilter.slice(5));
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Failed to load");
      return;
    }
    setRows((data as { transactions: TxRow[] }).transactions ?? []);
    setTotal((data as { total: number }).total ?? 0);
  }, [beneficiaryId, page, filter, debouncedQ, accountFilter]);

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
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3" data-tour="money-page">
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search description, merchant, or category"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="cs-input max-w-md flex-1"
        />
        {hasMultipleAccounts && (
          <select
            aria-label="Filter by account"
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setPage(1);
            }}
            className="cs-input w-auto shrink-0"
          >
            <option value="">All accounts</option>
            {connections.map((c) => (
              <optgroup key={c.id} label={c.institutionName}>
                <option value={`conn:${c.id}`}>All of {c.institutionName}</option>
                {c.accounts
                  .filter((a) => a.plaidAccountId)
                  .map((a) => (
                    <option key={a.plaidAccountId} value={`acct:${a.plaidAccountId}`}>
                      {a.name}
                      {a.mask ? ` ••${a.mask}` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        )}
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

      <div className="overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {loading && rows.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
            Loading…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
            No transactions yet. Connect a bank and tap sync, or widen your filters.
          </div>
        )}
        {rows.map((r) => {
          const inflow = isInflowCents(r.amountCents);
          const highlightUnclear = r.userCategory === "unclear";
          const acct = accountInfoForRow(r);
          const acctLabel = acct
            ? acct.accountName
              ? `${acct.institutionName} · ${acct.accountName}${acct.mask ? ` ••${acct.mask}` : ""}`
              : acct.institutionName
            : "";
          const excluded = Boolean(r.excludedFromThresholds);
          const countsTowardEarned = r.userCategory === "earned_income" && !r.pending;
          const showApply = applyPrompt?.sourceId === r._id;
          return (
            <div key={r._id} className="border-b border-[var(--color-cs-sep)] last:border-b-0">
            <article
              className={`flex items-start gap-3 px-3 py-2.5 ${
                highlightUnclear ? "bg-[var(--color-cs-warning-bg)]" : ""
              } ${excluded && countsTowardEarned ? "opacity-70" : ""}`}
              title={r.name}
            >
              <CategoryMark row={r} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold leading-tight text-[var(--color-cs-text)]">
                      {shortTitle(r.name ?? "", r.merchantName ?? "")}
                    </div>
                    {rowSubtitle(r) ? (
                      <div className="mt-0.5 truncate text-[12px] leading-tight text-[var(--color-cs-text-secondary)]">
                        {rowSubtitle(r)}
                      </div>
                    ) : null}
                    <div className="mt-0.5 text-[12px] leading-tight text-[var(--color-cs-text-muted)]">
                      {formatShortDate(r.date)}
                      {r.pending ? " · Pending" : ""}
                      {acctLabel ? ` · ${acctLabel}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailRow(r)}
                    aria-label="View transaction details"
                    className={`flex shrink-0 items-center gap-0.5 text-[14px] font-semibold leading-tight tabular-nums ${
                      inflow ? "text-[var(--color-cs-success)]" : "text-[var(--color-cs-text)]"
                    }`}
                  >
                    {formatSignedUsd(r.amountCents)}
                    <IconChevronRight size={14} stroke={2} className="text-[var(--color-cs-text-muted)]" />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {countsTowardEarned && (
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0"
                      checked={!excluded}
                      onChange={(e) => void patchExcluded(r._id, !e.target.checked)}
                      aria-label="Count this transaction toward earned-income limits"
                      title="Count toward limits"
                    />
                  )}
                  <select
                    aria-label="Change category"
                    className={`h-6 max-w-[7.5rem] shrink-0 truncate rounded-full border-0 px-2 text-[11px] font-medium ${badgeClass(r.userCategory)}`}
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
              </div>
            </article>
            {r.suggestedUserCategory &&
            r.suggestedUserCategory !== r.userCategory &&
            r.suggestedUserCategory !== "unclear" ? (
              <button
                type="button"
                className="block w-full truncate px-3 pb-1 text-left text-[11px] text-[var(--color-cs-brand)]"
                onClick={() => void patchCategory(r._id, r.suggestedUserCategory!)}
              >
                Use suggested: {CATEGORY_LABEL[r.suggestedUserCategory]}
              </button>
            ) : null}

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

      {detailRow &&
        (() => {
          const d = detailRow;
          const acct = accountInfoForRow(d);
          const cats = (d.category ?? "")
            .split(/›|·/)
            .map((p) => p.trim())
            .filter(Boolean);
          const rows: { label: string; value: string }[] = [
            { label: "Amount", value: formatSignedUsd(d.amountCents) },
            { label: "Date", value: formatShortDate(d.date) },
            ...(d.postedDate && d.postedDate !== d.date
              ? [{ label: "Posted", value: formatShortDate(d.postedDate) }]
              : []),
            { label: "Status", value: d.pending ? "Pending" : "Posted" },
            {
              label: "Institution",
              value: acct?.institutionName ?? "Unknown",
            },
            {
              label: "Account",
              value: acct?.accountName
                ? `${acct.accountName}${acct.mask ? ` ••${acct.mask}` : ""}`
                : "—",
            },
            { label: "Merchant", value: d.merchantName || "—" },
            { label: "Bank category", value: cats.join(" › ") || "—" },
            { label: "Category", value: CATEGORY_LABEL[d.userCategory] },
          ];
          return (
            <div className="fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/30" onClick={() => setDetailRow(null)} />
              <div className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col overflow-y-auto bg-[var(--color-cs-card)] p-4 shadow-xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-bold text-[var(--color-cs-text)]">
                    {shortTitle(d.name ?? "", d.merchantName ?? "")}
                  </h3>
                  <button
                    type="button"
                    className="cs-circbtn !h-8 !w-8"
                    aria-label="Close details"
                    onClick={() => setDetailRow(null)}
                  >
                    <IconX size={16} stroke={2} />
                  </button>
                </div>
                <dl className="flex flex-col divide-y divide-[var(--color-cs-sep)]">
                  {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4 py-2 text-[13px]">
                      <dt className="shrink-0 text-[var(--color-cs-text-secondary)]">{row.label}</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-[var(--color-cs-text)]">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {d.name && d.name !== shortTitle(d.name, d.merchantName ?? "") && (
                  <p className="mt-2 text-[12px] text-[var(--color-cs-text-muted)]">{d.name}</p>
                )}
                {d.notes ? (
                  <div className="mt-3 rounded-[12px] bg-[var(--color-cs-surface)] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase text-[var(--color-cs-text-muted)]">
                      Notes
                    </div>
                    <p className="text-[13px] text-[var(--color-cs-text)]">{d.notes}</p>
                  </div>
                ) : null}
                {d.excludedFromThresholds && (
                  <p className="mt-3 text-[12px] text-[var(--color-cs-warning)]">
                    Excluded from benefit limits{d.excludeReason ? ` — ${d.excludeReason}` : ""}.
                  </p>
                )}
                <div className="mt-4">
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-[var(--color-cs-text-muted)]">
                    Category
                  </label>
                  <select
                    className="cs-input w-full"
                    value={d.userCategory}
                    onChange={(e) => {
                      const next = e.target.value as UserCategory;
                      void patchCategory(d._id, next);
                      setDetailRow({ ...d, userCategory: next });
                    }}
                  >
                    {(Object.keys(CATEGORY_LABEL) as UserCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
                {d.receiptDocumentId && (
                  <Link
                    href={`/vault/${d.receiptDocumentId}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-cs-brand)]"
                  >
                    <IconReceipt size={15} stroke={1.8} aria-hidden />
                    View attached receipt
                  </Link>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
