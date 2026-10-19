import { SNAP_LUMP_SUM_CENTS } from "@/lib/benefits/snap-limits";
import { programCodeKey } from "@/lib/benefits/program-meta";
import { resourceCountNote, type ResourceAccount, type TxLike } from "@/lib/thresholds/metrics";

export type LimitSourceLine = {
  id: string;
  date: string | null;
  name: string;
  amountCents: number;
  category: string;
  included: boolean;
  note: string | null;
};

export type LimitSources = {
  income: LimitSourceLine[];
  accounts: LimitSourceLine[];
};

export function emptyLimitSources(): LimitSources {
  return { income: [], accounts: [] };
}

const INCOME_CATEGORIES = new Set(["earned_income", "benefit_deposit", "other_income"]);

export function buildLimitSources(
  transactions: Array<TxLike & { id: string }>,
  accounts: ResourceAccount[],
  monthPrefix: string,
): LimitSources {
  const income: LimitSourceLine[] = [];
  for (const t of transactions) {
    if (!t.date.startsWith(monthPrefix)) continue;
    if (t.amountCents >= 0) continue;
    if (!INCOME_CATEGORIES.has(t.userCategory)) continue;
    const amountCents = Math.abs(t.amountCents);
    let included = !t.pending && !t.excludedFromThresholds;
    let note: string | null = null;
    if (t.pending) note = "Pending — not in the total yet.";
    else if (t.excludedFromThresholds) note = "Marked to leave out of limits.";
    else if (t.userCategory === "other_income" && amountCents >= SNAP_LUMP_SUM_CENTS) {
      note = "Large enough to be treated as a one-time lump sum for SNAP.";
    }
    const name = (t.merchantName || t.name || "Deposit").trim() || "Deposit";
    income.push({
      id: t.id,
      date: t.date.slice(0, 10),
      name,
      amountCents,
      category: t.userCategory,
      included,
      note,
    });
  }
  income.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const accountLines: LimitSourceLine[] = accounts.map((account, index) => {
    const count = resourceCountNote(account);
    const name = (account.name || account.subtype || account.type || "Account").trim() || "Account";
    return {
      id: `acct-${index}-${name}`,
      date: null,
      name,
      amountCents: Math.max(0, account.currentBalanceCents ?? 0),
      category: "account",
      included: count.included,
      note: count.note,
    };
  });

  return { income, accounts: accountLines };
}

export function linesForLimit(
  sources: LimitSources,
  thresholdType: string,
  program?: string | null,
): { heading: string; detail: string; lines: LimitSourceLine[] } {
  if (thresholdType === "asset_balance") {
    return {
      heading: "Accounts in this balance",
      detail: "The resource total adds the balances marked included. It is not a sum of deposits.",
      lines: sources.accounts,
    };
  }

  const snapGross = programCodeKey(program ?? "") === "SNAP" && thresholdType === "monthly_gross_income";
  const categories =
    thresholdType === "monthly_earned_income"
      ? new Set(["earned_income"])
      : INCOME_CATEGORIES;

  const lines = sources.income
    .filter((line) => categories.has(line.category))
    .map((line) => {
      if (!snapGross || line.category !== "other_income") return line;
      if (!line.note?.includes("one-time lump sum")) return line;
      return {
        ...line,
        included: false,
        note: "Left out of the SNAP gross total as a one-time lump sum.",
      };
    });

  const detail =
    thresholdType === "monthly_earned_income"
      ? "These are the wage deposits in the total. The compared amount grosses wages up from the bank deposit, so it can be higher than the sum of these rows."
      : "These are the deposits in the total. Program rules can gross up wages or apply exclusions, so the compared amount can differ from a plain sum of these rows.";

  return {
    heading: "Transactions in this total",
    detail,
    lines,
  };
}
