import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import { sendAlertEmailsForNewAlerts } from "@/lib/email/dispatch-alerts";
import { logActivity } from "@/lib/activity/log-activity";
import { decryptPlaidToken } from "@/lib/plaid/crypto";
import { getPlaidClient, isPlaidExchangeConfigured } from "@/lib/plaid/server";
import { syncRecurringForConnection } from "@/lib/plaid/sync-recurring";
import { syncTransactionsForConnection } from "@/lib/plaid/sync-transactions";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";

export type RunBeneficiaryPlaidSyncResult = {
  ok: boolean;
  error?: string;
  connectionsSynced: number;
  transactionsUpserted: number;
  recurringStreamsUpserted: number;
  recurringStreamsRemoved: number;
  alertsCreated: number;
};

const empty: RunBeneficiaryPlaidSyncResult = {
  ok: false,
  connectionsSynced: 0,
  transactionsUpserted: 0,
  recurringStreamsUpserted: 0,
  recurringStreamsRemoved: 0,
  alertsCreated: 0,
};

/** Runs Plaid transaction + recurring sync for active connections, evaluates thresholds, optional alert email. */
export async function runBeneficiaryPlaidSync(params: {
  beneficiaryId: mongoose.Types.ObjectId;
  bankConnectionId?: mongoose.Types.ObjectId;
  actorUserId: string;
}): Promise<RunBeneficiaryPlaidSyncResult> {
  if (!isPlaidExchangeConfigured()) {
    return { ...empty, error: "Plaid not fully configured" };
  }

  await connectDB();

  const filter: Record<string, unknown> = {
    beneficiaryId: params.beneficiaryId,
    status: "active",
  };
  if (params.bankConnectionId) {
    filter._id = params.bankConnectionId;
  }

  const connections = await BankConnection.find(filter).lean();
  if (connections.length === 0) {
    return { ...empty, error: "No active bank connections" };
  }

  const client = getPlaidClient();
  let totalUpserted = 0;
  let recurringUpserted = 0;
  let recurringRemoved = 0;

  for (const conn of connections) {
    const accessToken = decryptPlaidToken(conn.plaidAccessTokenEncrypted as string);
    const initialCursor =
      typeof conn.syncCursor === "string" && conn.syncCursor.trim() !== ""
        ? conn.syncCursor
        : undefined;
    const sync = await syncTransactionsForConnection(
      client,
      accessToken,
      conn.beneficiaryId as mongoose.Types.ObjectId,
      conn._id as mongoose.Types.ObjectId,
      { maxPages: 40, initialCursor },
    );
    totalUpserted += sync.upserted;
    await BankConnection.updateOne(
      { _id: conn._id },
      { $set: { lastSyncAt: new Date(), syncCursor: sync.cursor } },
    );

    const rec = await syncRecurringForConnection(
      client,
      accessToken,
      conn.beneficiaryId as mongoose.Types.ObjectId,
      conn._id as mongoose.Types.ObjectId,
    );
    recurringUpserted += rec.upserted;
    recurringRemoved += rec.removed;
  }

  const evalResult = await evaluateThresholdsForBeneficiary({
    beneficiaryId: params.beneficiaryId,
    actorUserId: params.actorUserId,
  });

  await sendAlertEmailsForNewAlerts(evalResult.alertIdsCreated.map((id) => id.toString()));

  await logActivity({
    userId: params.actorUserId,
    beneficiaryId: params.beneficiaryId,
    category: "bank",
    action: "transaction.synced",
    details: {
      connections: connections.length,
      upserted: totalUpserted,
      recurringUpserted,
      recurringRemoved,
      alertsCreated: evalResult.alertsCreated,
    },
  });

  return {
    ok: true,
    connectionsSynced: connections.length,
    transactionsUpserted: totalUpserted,
    recurringStreamsUpserted: recurringUpserted,
    recurringStreamsRemoved: recurringRemoved,
    alertsCreated: evalResult.alertsCreated,
  };
}
