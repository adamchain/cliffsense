import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import Transaction from "@/lib/db/models/Transaction";
import RecurringStream from "@/lib/db/models/RecurringStream";
import { decryptPlaidToken } from "@/lib/plaid/crypto";
import { getPlaidClient, isPlaidExchangeConfigured } from "@/lib/plaid/server";
import { logActivity } from "@/lib/activity/log-activity";

async function loadAuthorizedConnection(userId: string, id: string) {
  await connectDB();
  const conn = await BankConnection.findById(id);
  if (!conn) return { error: "Not found" as const, status: 404 as const };
  const ben = await Beneficiary.findOne({
    _id: conn.beneficiaryId,
    ownerUserId: userId,
  }).select("_id");
  if (!ben) return { error: "Forbidden" as const, status: 403 as const };
  return { conn };
}

/** Reactivate a connection after a successful update-mode Link re-auth. */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isPlaidExchangeConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const loaded = await loadAuthorizedConnection(session.user.id, id);
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const { conn } = loaded;

  const client = getPlaidClient();
  const accessToken = decryptPlaidToken(conn.plaidAccessTokenEncrypted);
  try {
    const itemResp = await client.itemGet({ access_token: accessToken });
    const itemError = itemResp.data.item.error;
    if (itemError) {
      return NextResponse.json(
        {
          error: "Item still has an error",
          code: itemError.error_code,
          details: itemError.error_message,
        },
        { status: 409 },
      );
    }
  } catch (e) {
    console.error("itemGet on reactivate", e);
    return NextResponse.json({ error: "Could not verify item" }, { status: 502 });
  }

  await BankConnection.updateOne({ _id: conn._id }, { $set: { status: "active" } });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: conn.beneficiaryId,
    category: "bank",
    action: "plaid.reauthenticated",
    resourceType: "bankConnection",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isPlaidExchangeConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await connectDB();
  const conn = await BankConnection.findById(id);
  if (!conn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ben = await Beneficiary.findOne({
    _id: conn.beneficiaryId,
    ownerUserId: session.user.id,
  }).select("_id");
  if (!ben) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getPlaidClient();
  const accessToken = decryptPlaidToken(conn.plaidAccessTokenEncrypted);
  try {
    await client.itemRemove({ access_token: accessToken });
  } catch (e) {
    console.error("itemRemove", e);
  }

  await Transaction.deleteMany({ bankConnectionId: conn._id });
  await RecurringStream.deleteMany({ bankConnectionId: conn._id });
  await BankConnection.deleteOne({ _id: conn._id });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: conn.beneficiaryId,
    category: "bank",
    action: "plaid.disconnected",
    resourceType: "bankConnection",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}
