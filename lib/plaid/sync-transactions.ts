import type { UpdateFilter } from "mongodb";
import type { PlaidApi } from "plaid";
import type { Transaction as PlaidTransaction } from "plaid";
import Transaction, { type TransactionDoc } from "@/lib/db/models/Transaction";
import type { Types } from "mongoose";

function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

function mapPlaidTransaction(
  t: PlaidTransaction,
  beneficiaryId: Types.ObjectId,
  bankConnectionId: Types.ObjectId,
): Record<string, unknown> {
  const primary = t.personal_finance_category?.primary;
  const detailed = t.personal_finance_category?.detailed;
  const category = [primary, detailed].filter(Boolean).join(" › ");
  const plaidCategory = (t.category ?? []).join(" › ");
  return {
    beneficiaryId,
    bankConnectionId,
    plaidTransactionId: t.transaction_id,
    date: t.date,
    postedDate: t.authorized_date ?? t.date,
    amountCents: dollarsToCents(t.amount),
    currency: t.iso_currency_code ?? t.unofficial_currency_code ?? "USD",
    name: t.name ?? "",
    merchantName: t.merchant_name ?? "",
    category: category || plaidCategory,
    plaidCategory,
    pending: Boolean(t.pending),
  };
}

/** Pull transactions via /transactions/sync until no more pages or maxPages. */
export async function syncTransactionsForConnection(
  client: PlaidApi,
  accessToken: string,
  beneficiaryId: Types.ObjectId,
  bankConnectionId: Types.ObjectId,
  options?: { maxPages?: number; initialCursor?: string },
): Promise<{ cursor: string; upserted: number }> {
  const maxPages = options?.maxPages ?? 25;
  let cursor: string | undefined = options?.initialCursor?.trim() || undefined;
  let upserted = 0;
  let lastCursor = "";

  for (let page = 0; page < maxPages; page++) {
    const res = await client.transactionsSync({
      access_token: accessToken,
      cursor,
      options: { include_personal_finance_category: true },
    });
    const data = res.data;
    const byId = new Map<string, PlaidTransaction>();
    for (const t of [...(data.added ?? []), ...(data.modified ?? [])]) {
      byId.set(t.transaction_id, t);
    }
    const docs = [...byId.values()].map((t) => mapPlaidTransaction(t, beneficiaryId, bankConnectionId));

    if (docs.length > 0) {
      const setOnInsert: NonNullable<UpdateFilter<TransactionDoc>["$setOnInsert"]> = {
        userCategory: "unclear",
        excludedFromThresholds: false,
        excludeReason: "",
        notes: "",
        recurringStreamId: null,
        appliedRuleId: null,
        lastUserEditedAt: null,
      };
      const ops = docs.map((doc) => ({
        updateOne: {
          filter: {
            beneficiaryId,
            plaidTransactionId: doc.plaidTransactionId as string,
          },
          update: {
            $set: doc,
            $setOnInsert: setOnInsert,
          },
          upsert: true,
        },
      }));
      const bulk = await Transaction.bulkWrite(ops, { ordered: false });
      upserted += (bulk.upsertedCount ?? 0) + (bulk.modifiedCount ?? 0);
    }

    const removed = data.removed ?? [];
    if (removed.length > 0) {
      await Transaction.deleteMany({
        beneficiaryId,
        plaidTransactionId: { $in: removed.map((r) => r.transaction_id) },
      });
    }

    lastCursor = data.next_cursor;
    cursor = data.next_cursor;
    if (!data.has_more) {
      break;
    }
  }

  return { cursor: lastCursor, upserted };
}
