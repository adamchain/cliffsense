import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";
import User, { type UserDoc } from "@/lib/db/models/User";

/* ----------------------------------------------------------------------------
 * Bootstrap admins. These emails are always treated as internal admins: when
 * one requests an email sign-in code, the account is created (or promoted) on
 * the fly so there's no chicken-and-egg "you need an admin to make an admin"
 * problem. They still authenticate normally via the emailed 6-digit code.
 *
 * Extend the list without code changes by setting ADMIN_EMAILS (comma-separated).
 * ------------------------------------------------------------------------- */

const BUILTIN_ADMIN_EMAILS = ["adam@mybenefitspa.com", "frank@mybenefitspa.com"];

export function bootstrapAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...BUILTIN_ADMIN_EMAILS, ...fromEnv]));
}

export function isBootstrapAdminEmail(email: string): boolean {
  return bootstrapAdminEmails().includes(email.toLowerCase().trim());
}

/**
 * Ensure a bootstrap-admin account exists, is an active admin, and has finished
 * onboarding. Creates it with an unknown random password (sign-in is by code).
 * No-op for non-allowlisted emails. Returns the user doc, or null.
 */
export async function ensureBootstrapAdmin(email: string): Promise<UserDoc | null> {
  const e = email.toLowerCase().trim();
  if (!isBootstrapAdminEmail(e)) return null;

  await connectDB();
  const existing = await User.findOne({ email: e });
  if (existing) {
    let changed = false;
    if (!existing.isAdmin) {
      existing.isAdmin = true;
      changed = true;
    }
    if (existing.status === "disabled") {
      existing.status = "active";
      changed = true;
    }
    if (changed) await existing.save();
    return existing;
  }

  const name = e.split("@")[0].replace(/^./, (c) => c.toUpperCase());
  return User.create({
    email: e,
    // A valid bcrypt hash of a random secret nobody holds — code login only.
    hashedPassword: bcrypt.hashSync(crypto.randomBytes(24).toString("base64url"), 10),
    accountType: "fiduciary",
    name,
    isAdmin: true,
    status: "active",
    emailVerified: new Date(),
    onboardingStep: "complete",
  });
}
