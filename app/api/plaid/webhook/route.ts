import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { runBeneficiaryPlaidSync } from "@/lib/plaid/run-beneficiary-sync";
import { isPlaidLinkConfigured } from "@/lib/plaid/server";
import { verifyPlaidWebhook } from "@/lib/plaid/webhook-verify";

type PlaidWebhookBody = {
  webhook_type?: string;
  webhook_code?: string;
  item_id?: string;
};

/**
 * Plaid webhooks: verify JWT, then update connection status on ITEM events and
 * run incremental sync + threshold evaluation on TRANSACTIONS updates.
 */
export async function POST(req: Request) {
  if (!isPlaidLinkConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const verification = await verifyPlaidWebhook(
    req.headers.get("plaid-verification"),
    rawBody,
  );
  if (!verification.ok) {
    console.warn("plaid webhook rejected", verification.reason);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let body: PlaidWebhookBody = {};
  try {
    body = JSON.parse(rawBody) as PlaidWebhookBody;
  } catch {
    return NextResponse.json({ received: true });
  }

  const type = body.webhook_type ?? "";
  const code = body.webhook_code ?? "";
  const itemId = (body.item_id ?? "").trim();

  console.info("plaid webhook", type, code, itemId || "(no item)");

  if (!itemId) {
    return NextResponse.json({ received: true });
  }

  await connectDB();

  if (type === "ITEM") {
    if (code === "ITEM_LOGIN_REQUIRED" || code === "PENDING_EXPIRATION") {
      await BankConnection.updateOne({ plaidItemId: itemId }, { $set: { status: "login_required" } });
      return NextResponse.json({ received: true });
    }
    if (code === "USER_PERMISSION_REVOKED" || code === "ERROR") {
      await BankConnection.updateOne({ plaidItemId: itemId }, { $set: { status: "disconnected" } });
      return NextResponse.json({ received: true });
    }
    return NextResponse.json({ received: true });
  }

  if (type === "TRANSACTIONS") {
    const conn = await BankConnection.findOne({ plaidItemId: itemId }).lean();
    if (!conn) {
      return NextResponse.json({ received: true });
    }
    if (conn.status !== "active") {
      return NextResponse.json({ received: true });
    }

    const ben = await Beneficiary.findById(conn.beneficiaryId).select("ownerUserId").lean();
    if (!ben?.ownerUserId) {
      return NextResponse.json({ received: true });
    }
    const actorUserId = ben.ownerUserId.toString();

    try {
      await runBeneficiaryPlaidSync({
        beneficiaryId: conn.beneficiaryId as mongoose.Types.ObjectId,
        bankConnectionId: conn._id as mongoose.Types.ObjectId,
        actorUserId,
      });
    } catch (e) {
      console.warn("plaid webhook sync failed", e);
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
