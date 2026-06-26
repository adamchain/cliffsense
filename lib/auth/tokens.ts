import crypto from "node:crypto";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import AuthToken from "@/lib/db/models/AuthToken";

export type TokenPurpose = "email_verify" | "password_reset" | "login_code";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Issues a single-use token, storing only its hash. Returns the raw token. */
export async function issueAuthToken(
  userId: string | Types.ObjectId,
  purpose: TokenPurpose,
  ttlMs: number,
): Promise<string> {
  await connectDB();
  const raw = crypto.randomBytes(32).toString("base64url");
  await AuthToken.create({
    userId,
    purpose,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

/**
 * Validates and atomically consumes a token. Returns the owning userId on
 * success, or null if missing, wrong purpose, expired, or already used.
 */
export async function consumeAuthToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  await connectDB();
  const tokenHash = hashToken(token.trim());
  const doc = await AuthToken.findOneAndUpdate(
    { tokenHash, purpose, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  ).lean();
  return doc ? doc.userId.toString() : null;
}

/**
 * Issues a short numeric sign-in code (6 digits) for passwordless email login.
 * The stored hash is salted with the userId so two users can hold the same
 * visible code without colliding on the unique token index. Any earlier unused
 * code for the same user is invalidated first. Returns the raw code to email.
 */
export async function issueLoginCode(
  userId: string | Types.ObjectId,
  ttlMs: number,
): Promise<string> {
  await connectDB();
  await AuthToken.deleteMany({ userId, purpose: "login_code", usedAt: null });
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await AuthToken.create({
    userId,
    purpose: "login_code",
    tokenHash: hashToken(`${String(userId)}:${code}`),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return code;
}

/**
 * Validates and atomically consumes a login code for a specific user. Scoping by
 * userId means a guessed code only works against the account it was issued for.
 * Returns true on success.
 */
export async function consumeLoginCode(
  userId: string | Types.ObjectId,
  code: string,
): Promise<boolean> {
  await connectDB();
  const tokenHash = hashToken(`${String(userId)}:${code.trim()}`);
  const doc = await AuthToken.findOneAndUpdate(
    { userId, tokenHash, purpose: "login_code", usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  ).lean();
  return Boolean(doc);
}
