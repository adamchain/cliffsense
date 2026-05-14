import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { decryptPlaidToken } from "@/lib/plaid/crypto";
import {
  extractLinkTokenCreateResult,
  formatPlaidAxiosError,
  getPlaidClient,
  getPlaidRedirectUri,
  getPlaidWebhookUrl,
  isPlaidLinkConfigured,
  linkCountryCodes,
  linkTokenCreateConfig,
} from "@/lib/plaid/server";

const bodySchema = z.object({
  beneficiaryId: z.string().min(1),
  /** When set, create an update-mode link_token to re-auth this existing connection. */
  bankConnectionId: z.string().optional(),
});

export async function POST(req: Request) {
  if (!isPlaidLinkConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured (set PLAID_CLIENT_ID and PLAID_SECRET)." },
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
  const { beneficiaryId, bankConnectionId } = parsed.data;
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let updateAccessToken: string | undefined;
  if (bankConnectionId) {
    await connectDB();
    const conn = await BankConnection.findById(bankConnectionId)
      .select("beneficiaryId plaidAccessTokenEncrypted")
      .lean();
    if (!conn || conn.beneficiaryId.toString() !== beneficiaryId) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }
    const ben = await Beneficiary.findOne({
      _id: conn.beneficiaryId,
      ownerUserId: session.user.id,
    })
      .select("_id")
      .lean();
    if (!ben) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      updateAccessToken = decryptPlaidToken(conn.plaidAccessTokenEncrypted as string);
    } catch (e) {
      console.error("decrypt access token", e);
      return NextResponse.json({ error: "Could not load connection" }, { status: 500 });
    }
  }

  const client = getPlaidClient();
  const base = {
    user: { client_user_id: beneficiaryId },
    client_name: "CliffSense",
    language: "en" as const,
    country_codes: linkCountryCodes,
    webhook: getPlaidWebhookUrl(),
    redirect_uri: getPlaidRedirectUri(),
  };

  try {
    const create = updateAccessToken
      ? { ...base, access_token: updateAccessToken }
      : { ...base, ...linkTokenCreateConfig() };
    const resp = await client.linkTokenCreate(create);
    const out = extractLinkTokenCreateResult(resp);
    if (out.link_token) {
      return NextResponse.json({ link_token: out.link_token, expiration: out.expiration });
    }
    console.error("link-token: Plaid response missing link_token", extractLinkTokenCreateResult(resp));
  } catch (e) {
    console.error("linkTokenCreate failed", e);
    return NextResponse.json(
      {
        error: "Could not create Plaid link token",
        details: formatPlaidAxiosError(e),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { error: "Could not create Plaid link token", details: "Plaid response missing link_token" },
    { status: 502 },
  );
}
