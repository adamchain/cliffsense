import crypto from "node:crypto";
import { importJWK, jwtVerify, type JWK } from "jose";
import { getPlaidClient } from "@/lib/plaid/server";

type CachedKey = { jwk: JWK; expiresAt: number };
const keyCache = new Map<string, CachedKey>();

async function getVerificationKey(kid: string): Promise<JWK> {
  const cached = keyCache.get(kid);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.jwk;
  }
  const client = getPlaidClient();
  const resp = await client.webhookVerificationKeyGet({ key_id: kid });
  const key = resp.data.key as unknown as JWK & { expired_at?: string | null };
  if (!key || typeof key !== "object") {
    throw new Error("Plaid returned no verification key");
  }
  const ttlMs =
    typeof key.expired_at === "string" && key.expired_at
      ? Math.max(60_000, new Date(key.expired_at).getTime() - now)
      : 60 * 60 * 1000;
  keyCache.set(kid, { jwk: key, expiresAt: now + ttlMs });
  return key;
}

function decodeJwtHeader(jwt: string): { kid?: string; alg?: string } {
  const dot = jwt.indexOf(".");
  if (dot <= 0) return {};
  const headerB64 = jwt.slice(0, dot).replace(/-/g, "+").replace(/_/g, "/");
  try {
    const json = Buffer.from(headerB64, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { kid?: string; alg?: string };
    return parsed;
  } catch {
    return {};
  }
}

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Verify a Plaid webhook request per https://plaid.com/docs/api/webhooks/webhook-verification/.
 * Pass the RAW request body (string) — re-serialized JSON will not hash correctly.
 */
export async function verifyPlaidWebhook(
  jwt: string | null,
  rawBody: string,
): Promise<WebhookVerifyResult> {
  if (!jwt) return { ok: false, reason: "Missing Plaid-Verification header" };

  const { kid, alg } = decodeJwtHeader(jwt);
  if (!kid) return { ok: false, reason: "JWT missing kid" };
  if (alg !== "ES256") return { ok: false, reason: `Unexpected alg ${alg}` };

  let jwk: JWK;
  try {
    jwk = await getVerificationKey(kid);
  } catch (e) {
    return { ok: false, reason: `Could not fetch verification key: ${(e as Error).message}` };
  }

  let payload: { iat?: number; request_body_sha256?: string };
  try {
    const key = await importJWK(jwk, "ES256");
    const verified = await jwtVerify(jwt, key, { algorithms: ["ES256"] });
    payload = verified.payload as { iat?: number; request_body_sha256?: string };
  } catch (e) {
    return { ok: false, reason: `JWT verification failed: ${(e as Error).message}` };
  }

  const iatSec = typeof payload.iat === "number" ? payload.iat : 0;
  const ageSec = Math.floor(Date.now() / 1000) - iatSec;
  if (!iatSec || ageSec > 5 * 60 || ageSec < -60) {
    return { ok: false, reason: `Stale or future-dated webhook (age=${ageSec}s)` };
  }

  const expectedHash = crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
  if (
    !payload.request_body_sha256 ||
    !crypto.timingSafeEqual(
      Buffer.from(payload.request_body_sha256, "hex"),
      Buffer.from(expectedHash, "hex"),
    )
  ) {
    return { ok: false, reason: "Body hash mismatch" };
  }

  return { ok: true };
}
