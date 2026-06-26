import type { Types } from "mongoose";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import { formatPlainUsdFromCents, formatSignedUsd } from "@/lib/format/money";
import { programLabel } from "@/lib/benefits/program-meta";
import {
  grossMonthlyIncomeCents,
  monthlyIncomeBreakdownCents,
  ssiCountableMonthlyIncomeCents,
  utcMonthPrefix,
  type TxLike,
} from "@/lib/thresholds/metrics";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";

/** Cap on the number of recent transactions included in the advisor context. */
const RECENT_TX_LIMIT = 40;

const CATEGORY_LABEL: Record<string, string> = {
  earned_income: "Earned income (wages)",
  benefit_deposit: "Benefit deposit (unearned)",
  other_income: "Other income",
  expense: "Expense",
  transfer: "Transfer",
  unclear: "Uncategorized",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "on track",
  watch: "approaching limit",
  concern: "may be OVER the limit",
};

/**
 * Builds a compact, token-bounded plain-text snapshot of the beneficiary's
 * MyBenefitsPA financial picture for the AI advisor: enrolled programs, this
 * month's income breakdown (earned vs unearned with exclusions), account
 * balances, category mix, live limit/threshold status, and recent transactions.
 *
 * This is the user's own data, surfaced to the user's own advisor so it can give
 * grounded, personalized answers instead of telling the user to go read a screen.
 * Returns null if there's no beneficiary (advisor falls back to generic mode).
 */
export async function buildAdvisorAccountContext(
  beneficiaryId: Types.ObjectId,
): Promise<string | null> {
  const beneficiary = await Beneficiary.findById(beneficiaryId).lean();
  if (!beneficiary) return null;

  const now = new Date();
  const { prefix } = utcMonthPrefix(now);

  const [dash, connections, txRows] = await Promise.all([
    loadThresholdDashboardPayload(beneficiaryId),
    BankConnection.find({ beneficiaryId, status: "active" })
      .select({ institutionName: 1, accounts: 1 })
      .lean(),
    Transaction.find({
      beneficiaryId,
      date: { $gte: `${prefix}-01`, $lte: `${prefix}-31` },
    })
      .select({
        date: 1,
        name: 1,
        merchantName: 1,
        amountCents: 1,
        userCategory: 1,
        pending: 1,
        excludedFromThresholds: 1,
      })
      .sort({ date: -1 })
      .lean(),
  ]);

  const programs = (beneficiary.benefitsEnrolled ?? []).map((b) => b.program).filter(Boolean);
  const state = (beneficiary.state as string) || "—";
  const householdSize = Math.max(1, beneficiary.householdSize ?? 1);

  // Income breakdown (earned vs unearned, with SSI exclusions applied).
  const txLike: TxLike[] = txRows.map((t) => ({
    date: t.date,
    amountCents: t.amountCents,
    userCategory: t.userCategory,
    pending: Boolean(t.pending),
    excludedFromThresholds: Boolean(t.excludedFromThresholds),
  }));
  const breakdown = monthlyIncomeBreakdownCents(txLike, prefix);
  const grossMonthly = grossMonthlyIncomeCents(breakdown);
  const ssiCountable = ssiCountableMonthlyIncomeCents(breakdown);

  // Category mix for this month (count + summed magnitude).
  const catTotals = new Map<string, { count: number; cents: number }>();
  for (const t of txRows) {
    const key = t.userCategory ?? "unclear";
    const g = catTotals.get(key) ?? { count: 0, cents: 0 };
    g.count += 1;
    g.cents += Math.abs(t.amountCents);
    catTotals.set(key, g);
  }

  const lines: string[] = [];
  lines.push(`LIVE ACCOUNT CONTEXT for this user (current month ${prefix}). Use these real figures.`);
  lines.push("");
  lines.push(
    `Profile: state ${state}, household size ${householdSize}. Enrolled programs: ${
      programs.length ? programs.map((p) => programLabel(String(p))).join(", ") : "none selected"
    }.`,
  );

  // --- Income breakdown ---
  lines.push("");
  lines.push("Income this month (from categorized bank deposits):");
  lines.push(
    `- Earned wages: ${formatPlainUsdFromCents(breakdown.earnedNetCents)} net deposited, ≈ ${formatPlainUsdFromCents(
      breakdown.earnedGrossCents,
    )} grossed up to pre-tax (benefit programs count gross).`,
  );
  lines.push(
    `- Unearned benefit deposits (SSDI/SS/etc.): ${formatPlainUsdFromCents(breakdown.benefitCents)}.`,
  );
  lines.push(`- Other income (interest, etc.): ${formatPlainUsdFromCents(breakdown.otherCents)}.`);
  lines.push(
    `- Total gross monthly income (SNAP-style, all countable): ${formatPlainUsdFromCents(grossMonthly)}.`,
  );
  lines.push(
    `- SSI/Medicaid countable income after the $20 general + $65 earned exclusions and halving remaining wages: ${formatPlainUsdFromCents(
      ssiCountable,
    )}.`,
  );
  lines.push(
    `- Projected earned income by month-end (incl. recurring payroll): ${formatPlainUsdFromCents(
      dash.metrics.projectedEarnedIncomeCents,
    )}.`,
  );

  // --- Balances ---
  lines.push("");
  if (connections.length === 0) {
    lines.push("Account balances: no active bank connection linked.");
  } else {
    lines.push("Account balances:");
    for (const c of connections) {
      for (const a of c.accounts ?? []) {
        const name = a.name || a.subtype || a.type || "Account";
        const mask = a.mask ? ` ••${a.mask}` : "";
        lines.push(
          `- ${c.institutionName || "Bank"} — ${name}${mask} (${a.type || "?"}/${
            a.subtype || "?"
          }): ${formatPlainUsdFromCents(a.currentBalanceCents ?? 0)}.`,
        );
      }
    }
    lines.push(
      `- Highest checking/savings balance (used for SSI/Medicaid resource limits): ${formatPlainUsdFromCents(
        dash.metrics.maxDepositoryBalanceCents,
      )}.`,
    );
  }

  // --- Category mix ---
  if (catTotals.size > 0) {
    lines.push("");
    lines.push("This month's transaction categories:");
    for (const [key, g] of catTotals) {
      lines.push(
        `- ${CATEGORY_LABEL[key] ?? key}: ${g.count} transaction${g.count === 1 ? "" : "s"}, ${formatPlainUsdFromCents(
          g.cents,
        )} total.`,
      );
    }
  }

  // --- Limit / threshold status ---
  lines.push("");
  if (dash.rows.length === 0) {
    lines.push("Limit status: no reference limits attached yet.");
  } else {
    lines.push("Reference limit status (estimates, not determinations):");
    for (const r of dash.rows) {
      if (!r.attached) continue;
      const cur = r.currentValueCents != null ? formatPlainUsdFromCents(r.currentValueCents) : "n/a";
      lines.push(
        `- [${r.program ?? "—"}] ${r.label}: your ${cur} vs limit ${formatPlainUsdFromCents(
          r.limitCents,
        )} → ${STATUS_LABEL[r.status] ?? r.status}.`,
      );
    }
  }

  // --- Recent transactions (bounded) ---
  if (txRows.length > 0) {
    lines.push("");
    const shown = txRows.slice(0, RECENT_TX_LIMIT);
    lines.push(
      `Recent transactions this month (${shown.length} of ${txRows.length} shown, newest first; negative = money in):`,
    );
    for (const t of shown) {
      const label = t.merchantName || t.name || "Transaction";
      const flags = [
        CATEGORY_LABEL[t.userCategory ?? "unclear"] ?? t.userCategory,
        t.pending ? "pending" : null,
        t.excludedFromThresholds ? "excluded from limits" : null,
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${t.date} ${label}: ${formatSignedUsd(t.amountCents)} (${flags}).`);
    }
    if (txRows.length > RECENT_TX_LIMIT) {
      lines.push(`- …and ${txRows.length - RECENT_TX_LIMIT} more this month not listed.`);
    }
  }

  lines.push("");
  lines.push(
    "When the user asks how their income is categorized, which exclusions apply, or whether they're near a limit, ANSWER FROM THE FIGURES ABOVE — cite the actual amounts. Do not tell them to go check a screen; you can see their data. Still remind them these are estimates and the agency makes the final determination.",
  );

  return lines.join("\n");
}
