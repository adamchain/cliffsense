import type { Types } from "mongoose";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import {
  irweSourceAllowsAuto,
  summarizeExpenses,
  type ExpenseInput,
} from "@/lib/transactions/recurring-expenses";

const WINDOW_DAYS = 120;
const MAX_IRWE_CENTS = 100_000_00;

export type IrweSyncResult = {
  /** Cents the income math should use. */
  monthlyCents: number;
  /** True when this amount came from Money and may be replaced on the next pass. */
  applied: boolean;
  changed: boolean;
  source: "" | "auto" | "manual";
  note: string;
};

function isoDaysAgo(days: number): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() - days);
  return utc.toISOString().slice(0, 10);
}

function storedCents(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_IRWE_CENTS, Math.round(n));
}

/**
 * Writes the monthly pharmacy / transportation / medical estimate onto the
 * person when they have not saved their own work-expense amount.
 */
export async function syncAutoIrweFromExpenses(beneficiaryId: Types.ObjectId): Promise<IrweSyncResult> {
  const ben = await Beneficiary.findById(beneficiaryId).select("irweMonthlyCents irweSource").lean();
  const stored = storedCents(ben?.irweMonthlyCents);
  const source = ben?.irweSource === "auto" || ben?.irweSource === "manual" ? ben.irweSource : "";

  const docs = await Transaction.find({
    beneficiaryId,
    amountCents: { $gt: 0 },
    userCategory: "expense",
    pending: { $ne: true },
    excludedFromThresholds: { $ne: true },
    date: { $gte: isoDaysAgo(WINDOW_DAYS) },
  })
    .select({ date: 1, amountCents: 1, name: 1, merchantName: 1, category: 1 })
    .lean();

  const expenses: ExpenseInput[] = docs.map((row) => ({
    id: String(row._id),
    date: row.date,
    amountCents: row.amountCents,
    name: row.name ?? "",
    merchantName: row.merchantName ?? "",
    category: row.category ?? "",
  }));
  const summary = summarizeExpenses(expenses);
  const monthly = Math.min(MAX_IRWE_CENTS, Math.max(0, summary.workRelatedMonthlyCents));
  const note = summary.workRelatedNote;

  if (!irweSourceAllowsAuto(source, stored)) {
    return { monthlyCents: stored, applied: false, changed: false, source: "manual", note };
  }

  if (monthly <= 0) {
    if (source === "auto" && stored > 0) {
      await Beneficiary.updateOne(
        { _id: beneficiaryId },
        { $set: { irweMonthlyCents: 0, irweSource: "" } },
      );
      return { monthlyCents: 0, applied: true, changed: true, source: "", note: "" };
    }
    return { monthlyCents: 0, applied: false, changed: false, source, note: "" };
  }

  const changed = monthly !== stored || source !== "auto";
  if (changed) {
    await Beneficiary.updateOne(
      { _id: beneficiaryId },
      { $set: { irweMonthlyCents: monthly, irweSource: "auto" } },
    );
  }
  return { monthlyCents: monthly, applied: true, changed, source: "auto", note };
}
