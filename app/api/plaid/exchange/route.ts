import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import { encryptPlaidToken } from "@/lib/plaid/crypto";
import {
  formatPlaidAxiosError,
  getPlaidClient,
  isPlaidExchangeConfigured,
  linkCountryCodes,
} from "@/lib/plaid/server";
import { syncTransactionsForConnection } from "@/lib/plaid/sync-transactions";

const bodySchema = z.object({
  public_token: z.string().min(1),
  beneficiaryId: z.string().min(1),
});

function dollarsToCents(n: number | null | undefined): number {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export async function POST(req: Request) {
  if (!isPlaidExchangeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Plaid exchange not configured (set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENCRYPTION_KEY).",
      },
      { status: 503 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { public_token, beneficiaryId } = parsed.data;
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const beneficiaryObjectId = new mongoose.Types.ObjectId(beneficiaryId);
  const client = getPlaidClient();

  try {
    const ex = await client.itemPublicTokenExchange({ public_token });
    const accessToken = ex.data.access_token;
    const itemId = ex.data.item_id;

    await connectDB();
    const existing = await BankConnection.findOne({ plaidItemId: itemId }).lean();
    if (existing) {
      return NextResponse.json({ error: "This bank item is already linked." }, { status: 409 });
    }

    const itemResp = await client.itemGet({ access_token: accessToken });
    const instId = itemResp.data.item.institution_id ?? "";
    let institutionName = "";
    if (instId) {
      try {
        const inst = await client.institutionsGetById({
          institution_id: instId,
          country_codes: linkCountryCodes,
        });
        institutionName = inst.data.institution.name;
      } catch {
        institutionName = "";
      }
    }

    const acctResp = await client.accountsGet({ access_token: accessToken });
    const accounts = acctResp.data.accounts.map((a) => ({
      plaidAccountId: a.account_id,
      name: a.name,
      mask: a.mask ?? "",
      type: String(a.type ?? ""),
      subtype: String(a.subtype ?? ""),
      currentBalanceCents: dollarsToCents(a.balances.current),
      availableBalanceCents: dollarsToCents(
        a.balances.available ?? a.balances.current ?? 0,
      ),
    }));

    const encrypted = encryptPlaidToken(accessToken);

    const conn = await BankConnection.create({
      beneficiaryId: beneficiaryObjectId,
      plaidItemId: itemId,
      plaidAccessTokenEncrypted: encrypted,
      plaidInstitutionId: instId,
      institutionName,
      accounts,
      status: "active",
    });

    const sync = await syncTransactionsForConnection(
      client,
      accessToken,
      beneficiaryObjectId,
      conn._id,
      { maxPages: 30 },
    );

    await BankConnection.updateOne(
      { _id: conn._id },
      { $set: { lastSyncAt: new Date(), syncCursor: sync.cursor } },
    );

    await logActivity({
      userId: session.user.id,
      beneficiaryId: beneficiaryObjectId,
      category: "bank",
      action: "plaid.linked",
      resourceType: "bankConnection",
      resourceId: conn._id.toString(),
      details: {
        institutionName,
        plaidItemId: itemId,
        accounts: accounts.length,
        transactionsUpserted: sync.upserted,
      },
    });

    return NextResponse.json({
      ok: true,
      bankConnectionId: conn._id.toString(),
      institutionName,
      accounts: accounts.length,
      transactionsSynced: sync.upserted,
    });
  } catch (e) {
    console.error("plaid exchange", e);
    return NextResponse.json(
      { error: "Plaid exchange failed", details: formatPlaidAxiosError(e) },
      { status: 502 },
    );
  }
}
