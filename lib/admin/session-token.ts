/** Separate from the main app session cookie. */
export const ADMIN_COOKIE_NAME = "bw_admin";

/** Admin console stays signed in for a workday, then asks for a new code. */
export const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;

export type AdminSessionClaims = {
  email: string;
  uid: string;
  exp: number;
};

export function adminCookieSecure(): boolean {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function adminSessionSecret(): string | null {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  return secret ? secret : null;
}

/** Signed cookie value. Payload is `{ email, uid, exp }`. */
export async function signAdminSession(
  claims: { email: string; uid: string },
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  const payload = bytesToB64url(
    new TextEncoder().encode(
      JSON.stringify({
        email: claims.email.toLowerCase().trim(),
        uid: claims.uid,
        exp: nowSec + ADMIN_SESSION_MAX_AGE,
      }),
    ),
  );
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** Returns the claims when the signature and expiry are valid. */
export async function readAdminSession(
  token: string | undefined | null,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<AdminSessionClaims | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let sigBytes: Uint8Array;
  let payloadBytes: Uint8Array;
  try {
    sigBytes = b64urlToBytes(sig);
    payloadBytes = b64urlToBytes(payload);
  } catch {
    return null;
  }
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as BufferSource,
    new TextEncoder().encode(payload),
  );
  if (!ok) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<AdminSessionClaims>;
    if (!parsed.email || !parsed.uid || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= nowSec) return null;
    return { email: parsed.email, uid: parsed.uid, exp: parsed.exp };
  } catch {
    return null;
  }
}
