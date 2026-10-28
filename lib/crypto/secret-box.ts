import crypto from "crypto";

/**
 * General-purpose encryption for secrets stored at rest (vault logins, card
 * numbers). Same AES-256-GCM scheme as the Plaid token crypto, but keyed by its
 * own env var so secret storage can be rotated independently. Falls back to the
 * Plaid key so existing deployments work without new configuration.
 */
const ALGO = "aes-256-gcm";
const IV_LEN = 16;

function getKey(): Buffer {
  const b64 = process.env.VAULT_SECRET_KEY || process.env.PLAID_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error("VAULT_SECRET_KEY (or PLAID_ENCRYPTION_KEY) is not set (32-byte key, base64)");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("VAULT_SECRET_KEY must decode to exactly 32 bytes");
  }
  return key;
}

/** Returns true when a key is configured, so callers can degrade gracefully. */
export function secretStorageAvailable(): boolean {
  const b64 = process.env.VAULT_SECRET_KEY || process.env.PLAID_ENCRYPTION_KEY;
  if (!b64) return false;
  try {
    return Buffer.from(b64, "base64").length === 32;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

/** Encrypt an arbitrary object of sensitive fields as one blob. */
export function encryptJson(obj: Record<string, unknown>): string {
  return encryptSecret(JSON.stringify(obj));
}

export function decryptJson<T = Record<string, unknown>>(payload: string): T {
  return JSON.parse(decryptSecret(payload)) as T;
}
