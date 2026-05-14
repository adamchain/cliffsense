import type { PlaidApi } from "plaid";
import type { TransactionStream } from "plaid";
import { TransactionStreamStatus } from "plaid";
import type { Types } from "mongoose";
import RecurringStream from "@/lib/db/models/RecurringStream";

function amountCents(a?: { amount?: number | null }): number {
  return Math.round((a?.amount ?? 0) * 100);
}

function mapFrequency(
  f: string | undefined,
): "weekly" | "biweekly" | "monthly" | "semimonthly" {
  switch (f) {
    case "WEEKLY":
      return "weekly";
    case "BIWEEKLY":
      return "biweekly";
    case "SEMI_MONTHLY":
      return "semimonthly";
    case "MONTHLY":
    case "ANNUALLY":
    case "UNKNOWN":
    default:
      return "monthly";
  }
}

function mapStatus(s: string | undefined): "mature" | "early_detection" {
  if (s === TransactionStreamStatus.Mature) return "mature";
  return "early_detection";
}

function guessUserCategory(
  stream: TransactionStream,
  flow: "inflow" | "outflow",
):
  | "earned_income"
  | "benefit_deposit"
  | "other_income"
  | "subscription"
  | "rent"
  | "other" {
  const text = `${stream.description ?? ""} ${stream.merchant_name ?? ""}`.toLowerCase();
  if (flow === "outflow") {
    if (/\b(rent|lease|mortgage|landlord)\b/.test(text)) return "rent";
    if (/\b(netflix|spotify|hulu|subscription|prime|apple\.com\/bill)\b/.test(text)) return "subscription";
    return "other";
  }
  if (/\b(ssa|ssi|social security|ssdi|snap|ebt|irs treas|unemployment|u\.s\. treasury)\b/.test(text)) {
    return "benefit_deposit";
  }
  if (/\b(payroll|salary|direct dep|wages|paycheck|gusto|adp|paychex|workday)\b/.test(text)) {
    return "earned_income";
  }
  return "other_income";
}

function streamToUpdate(
  stream: TransactionStream,
  flow: "inflow" | "outflow",
  beneficiaryId: Types.ObjectId,
  bankConnectionId: Types.ObjectId,
): Record<string, unknown> {
  const status = mapStatus(stream.status);
  return {
    beneficiaryId,
    bankConnectionId,
    plaidStreamId: stream.stream_id,
    description: stream.description ?? "",
    merchantName: stream.merchant_name ?? "",
    type: flow,
    averageAmountCents: amountCents(stream.average_amount),
    lastAmountCents: amountCents(stream.last_amount),
    frequency: mapFrequency(stream.frequency),
    status,
    firstDate: stream.first_date ?? "",
    lastDate: stream.last_date ?? "",
    predictedNextDate: stream.predicted_next_date ?? "",
    predictedNextAmountCents: stream.last_amount?.amount != null ? amountCents(stream.last_amount) : null,
  };
}

/** Upsert recurring streams from Plaid; removes tombstoned and orphans for this connection. */
export async function syncRecurringForConnection(
  client: PlaidApi,
  accessToken: string,
  beneficiaryId: Types.ObjectId,
  bankConnectionId: Types.ObjectId,
): Promise<{ upserted: number; removed: number }> {
  let upserted = 0;
  let removed = 0;
  try {
    const res = await client.transactionsRecurringGet({ access_token: accessToken });
    const data = res.data;
    const inflows = data.inflow_streams ?? [];
    const outflows = data.outflow_streams ?? [];
    const seen = new Set<string>();

    const process = async (stream: TransactionStream, flow: "inflow" | "outflow") => {
      if (stream.status === TransactionStreamStatus.Tombstoned) {
        const del = await RecurringStream.deleteOne({
          bankConnectionId,
          plaidStreamId: stream.stream_id,
        });
        removed += del.deletedCount ?? 0;
        return;
      }
      const base = streamToUpdate(stream, flow, beneficiaryId, bankConnectionId);
      seen.add(stream.stream_id);
      const existing = await RecurringStream.findOne({
        beneficiaryId,
        plaidStreamId: stream.stream_id,
      })
        .select("userCategory isConfirmed")
        .lean();
      const guess = guessUserCategory(stream, flow);
      const patch: Record<string, unknown> = { ...base };
      if (!existing) {
        patch.userCategory = guess;
        patch.isConfirmed = false;
      }
      await RecurringStream.findOneAndUpdate(
        { beneficiaryId, plaidStreamId: stream.stream_id },
        { $set: patch },
        { upsert: true, new: true },
      );
      upserted += 1;
    };

    for (const s of inflows) await process(s, "inflow");
    for (const s of outflows) await process(s, "outflow");

    const delOrphans = await RecurringStream.deleteMany({
      bankConnectionId,
      plaidStreamId: { $nin: [...seen] },
    });
    removed += delOrphans.deletedCount ?? 0;
  } catch (e) {
    console.warn("transactionsRecurringGet failed (product may be off or sandbox fixture missing)", e);
  }

  return { upserted, removed };
}
