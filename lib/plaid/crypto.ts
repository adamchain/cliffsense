import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;

function getKey(): Buffer {
  const b64 = process.env.PLAID_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error("PLAID_ENCRYPTION_KEY is not set (32-byte key, base64-encoded)");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("PLAID_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

/** Store-only: encrypt Plaid access_token (never log). */
export function encryptPlaidToken(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptPlaidToken(payload: string): string {
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
