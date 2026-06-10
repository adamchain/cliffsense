import crypto from "node:crypto";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import AuthToken from "@/lib/db/models/AuthToken";

export type TokenPurpose = "email_verify" | "password_reset";

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
