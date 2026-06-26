"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconBriefcase,
  IconBuildingBank,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFilter,
  IconHelpCircle,
  IconRefresh,
  IconShieldCheck,
  IconTag,
} from "@tabler/icons-react";
import Link from "next/link";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
import { formatShortDate, formatSignedUsd, isInflowCents } from "@/lib/format/money";
import { AccountsPanel, type AccountConnection } from "@/components/transactions/accounts-panel";

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
      return "bg-[#fff4ce] text-[#797673]";
    case "expense":
      return "bg-[#fafafa] text-[var(--color-cs-text-secondary)]";
    default:
      return "bg-[var(--color-cs-nav-hover)] text-[var(--color-cs-text-secondary)]";
  }
}

function CategoryIcon({ cat }: { cat: UserCategory }) {
  if (cat === "earned_income") return <IconBriefcase size={12} aria-hidden />;
  if (cat === "benefit_deposit") return <IconShieldCheck size={12} aria-hidden />;
  if (cat === "unclear") return <IconHelpCircle size={12} aria-hidden />;
  return null;
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
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

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

  useEffect(() => {
    if (!beneficiaryId) return;
    (async () => {
      const params = new URLSearchParams({
        beneficiaryId,
        filter: "unclear",
        page: "1",
        limit: "1",
      });
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUnclearTotal((data as { total: number }).total ?? 0);
      }
    })();
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
    if (!beneficiaryId) return;
    const params = new URLSearchParams({
      beneficiaryId,
      filter: "unclear",
      page: "1",
      limit: "1",
    });
    const u = await fetch(`/api/transactions?${params}`);
    const udata = await u.json().catch(() => ({}));
    if (u.ok) {
      setUnclearTotal((udata as { total: number }).total ?? 0);
    }
  }

  async function patchCategory(id: string, userCategory: UserCategory) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCategory }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { transaction: TxRow };
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...data.transaction } : r)));
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
        Add a beneficiary profile (onboarding) to see transactions.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Complete profile
        </Link>
      </p>
    );
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Transactions</div>
      <h1 className="mb-3.5 text-xl font-medium text-[var(--color-cs-text)]">Transactions</h1>

      <AppToolbar>
        <ToolbarButton primary onClick={runSync}>
          <IconRefresh size={16} stroke={1.5} aria-hidden className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync"}
        </ToolbarButton>
        <span className="mx-1 hidden h-5 w-px bg-[var(--color-cs-border)] sm:inline-block" aria-hidden />
        <ToolbarButton href="/reports">
          <IconFilter size={16} stroke={1.5} aria-hidden />
          Filter
        </ToolbarButton>
        <ToolbarButton href="#">
          <IconCalendar size={16} stroke={1.5} aria-hidden />
          Date range
        </ToolbarButton>
        <ToolbarButton
          primary={showAccounts}
          onClick={() => setShowAccounts((v) => !v)}
        >
          <IconBuildingBank size={16} stroke={1.5} aria-hidden />
          {showAccounts ? "Hide accounts" : `Accounts${connections.length ? ` (${connections.length})` : ""}`}
        </ToolbarButton>
        <span className="mx-1 hidden h-5 w-px bg-[var(--color-cs-border)] sm:inline-block" aria-hidden />
        <ToolbarButton onClick={() => void applyPlaidSuggestions()} disabled={applyingPlaid}>
          <IconTag size={16} stroke={1.5} aria-hidden />
          {applyingPlaid ? "Applying…" : "Apply Plaid categories"}
        </ToolbarButton>
        <ToolbarButton href="/reports">
          <IconDownload size={16} stroke={1.5} aria-hidden />
          Export
        </ToolbarButton>
      </AppToolbar>

      {showAccounts && (
        <AccountsPanel beneficiaryId={beneficiaryId} connections={connections} />
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setFilter(c.id);
              setPage(1);
            }}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
              filter === c.id
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <input
          type="search"
          placeholder="Search description, merchant, or Plaid category"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="h-8 w-full max-w-md rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
        />
      </div>

      {error && (
        <p className="mb-3 text-xs text-[var(--color-cs-danger)]" role="alert">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-[13px] table-fixed">
            <colgroup>
              <col className="w-[92px]" />
              <col />
              <col className="w-[200px]" />
              <col className="w-[120px]" />
              <col className="w-[104px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] font-medium text-[var(--color-cs-text-secondary)]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Your category</th>
                <th className="px-3 py-2">Limits</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">
                    No transactions yet. Connect a bank and run <strong>Sync</strong>, or widen your filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const inflow = isInflowCents(r.amountCents);
                  const highlightUnclear = r.userCategory === "unclear";
                  const excluded = Boolean(r.excludedFromThresholds);
                  const countsTowardEarned = r.userCategory === "earned_income" && !r.pending;
                  return (
                    <tr
                      key={r._id}
                      className={`border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)] ${
                        highlightUnclear ? "bg-[#fffbf4]" : ""
                      } ${excluded && countsTowardEarned ? "opacity-80" : ""}`}
                    >
                      <td className="px-3 py-2.5 align-top text-[var(--color-cs-text)]">
                        {formatShortDate(r.date)}
                        {r.pending && (
                          <span className="mt-0.5 block text-[10px] text-[var(--color-cs-text-muted)]">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="font-medium text-[var(--color-cs-text)]">{r.name || "—"}</div>
                        <div className="mt-0.5 text-[11px] text-[var(--color-cs-text-secondary)]">
                          {[r.merchantName, r.category].filter(Boolean).join(" · ") || "—"}
                        </div>
                        {r.pfcPrimary ? (
                          <div className="mt-1 text-[10px] leading-snug text-[var(--color-cs-text-muted)]">
                            Plaid: {[r.pfcPrimary, r.pfcDetailed].filter(Boolean).join(" › ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${badgeClass(r.userCategory)}`}
                          >
                            <CategoryIcon cat={r.userCategory} />
                            {CATEGORY_LABEL[r.userCategory]}
                          </span>
                          {r.suggestedUserCategory &&
                          r.suggestedUserCategory !== r.userCategory &&
                          r.suggestedUserCategory !== "unclear" ? (
                            <p className="text-[10px] leading-snug text-[var(--color-cs-text-muted)]">
                              Suggested for limits:{" "}
                              <span className="font-medium text-[var(--color-cs-text-secondary)]">
                                {CATEGORY_LABEL[r.suggestedUserCategory]}
                              </span>
                            </p>
                          ) : null}
                          <select
                            aria-label="Change category"
                            className="h-7 max-w-[180px] rounded-sm border border-[var(--color-cs-border)] bg-white px-1.5 text-[11px] text-[var(--color-cs-text)]"
                            value={r.userCategory}
                            onChange={(e) => void patchCategory(r._id, e.target.value as UserCategory)}
                          >
                            {(Object.keys(CATEGORY_LABEL) as UserCategory[]).map((k) => (
                              <option key={k} value={k}>
                                {CATEGORY_LABEL[k]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {countsTowardEarned ? (
                          <label className="flex cursor-pointer items-start gap-2 text-[11px] text-[var(--color-cs-text-secondary)]">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={!excluded}
                              onChange={(e) => void patchExcluded(r._id, !e.target.checked)}
                              aria-label="Count this transaction toward earned-income limits"
                            />
                            <span>Count toward limits</span>
                          </label>
                        ) : (
                          <span className="text-[11px] text-[var(--color-cs-text-muted)]">—</span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right align-top font-medium tabular-nums ${
                          inflow ? "text-[var(--color-cs-success)]" : "text-[var(--color-cs-text)]"
                        }`}
                      >
                        {formatSignedUsd(r.amountCents)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- Mobile card list ---------- */}
        <div className="divide-y divide-[var(--color-cs-border)] sm:hidden">
          {loading && rows.length === 0 ? (
            <div className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-8 text-center text-[var(--color-cs-text-secondary)]">
              No transactions yet. Connect a bank and run <strong>Sync</strong>, or widen your filters.
            </div>
          ) : (
            rows.map((r) => {
              const inflow = isInflowCents(r.amountCents);
              const highlightUnclear = r.userCategory === "unclear";
              const excluded = Boolean(r.excludedFromThresholds);
              const countsTowardEarned = r.userCategory === "earned_income" && !r.pending;
              return (
                <div key={r._id} className={`px-3 py-3 ${highlightUnclear ? "bg-[#fffbf4]" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--color-cs-text)]">{r.name || "—"}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--color-cs-text-secondary)]">
                        {[r.merchantName, r.category].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-right font-medium tabular-nums ${
                        inflow ? "text-[var(--color-cs-success)]" : "text-[var(--color-cs-text)]"
                      }`}
                    >
                      {formatSignedUsd(r.amountCents)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--color-cs-text-muted)]">
                    <span>{formatShortDate(r.date)}</span>
                    {r.pending && <span>· Pending</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${badgeClass(r.userCategory)}`}
                    >
                      <CategoryIcon cat={r.userCategory} />
                      {CATEGORY_LABEL[r.userCategory]}
                    </span>
                    <select
                      aria-label="Change category"
                      className="h-7 rounded-sm border border-[var(--color-cs-border)] bg-white px-1.5 text-[11px] text-[var(--color-cs-text)]"
                      value={r.userCategory}
                      onChange={(e) => void patchCategory(r._id, e.target.value as UserCategory)}
                    >
                      {(Object.keys(CATEGORY_LABEL) as UserCategory[]).map((k) => (
                        <option key={k} value={k}>
                          {CATEGORY_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {r.suggestedUserCategory &&
                  r.suggestedUserCategory !== r.userCategory &&
                  r.suggestedUserCategory !== "unclear" ? (
                    <p className="mt-1.5 text-[10px] leading-snug text-[var(--color-cs-text-muted)]">
                      Suggested for limits:{" "}
                      <span className="font-medium text-[var(--color-cs-text-secondary)]">
                        {CATEGORY_LABEL[r.suggestedUserCategory]}
                      </span>
                    </p>
                  ) : null}
                  {countsTowardEarned && (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-[var(--color-cs-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={(e) => void patchExcluded(r._id, !e.target.checked)}
                        aria-label="Count this transaction toward earned-income limits"
                      />
                      <span>Count toward limits</span>
                    </label>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3.5 py-2.5 text-xs text-[var(--color-cs-text-secondary)]">
          <span>
            Showing {showingFrom}–{showingTo} of {total} transactions
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              className="rounded p-1 hover:bg-[var(--color-cs-border)] disabled:opacity-40"
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              className="rounded p-1 hover:bg-[var(--color-cs-border)] disabled:opacity-40"
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
