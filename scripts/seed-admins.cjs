#!/usr/bin/env node
/**
 * Ensure the internal admin accounts exist as active, onboarded admins so they
 * can sign in with an emailed 6-digit code (no password needed). Idempotent:
 * safe to run repeatedly. Mirrors ensureBootstrapAdmin() in lib/admin/bootstrap.ts.
 *
 * The two built-ins below match BUILTIN_ADMIN_EMAILS in the app, so they are
 * also auto-provisioned on first login-code request even without this script —
 * running it just pre-creates them (handy right after a deploy).
 *
 * Usage:
 *   npm run admin:seed                              # adam@ + frank@ (+ ADMIN_EMAILS)
 *   npm run admin:seed -- someone@mybenefitspa.com  # also promote extra emails
 *   MONGODB_URI="<prod uri>" npm run admin:seed     # target a specific database
 *
 * Env required: MONGODB_URI (read from .env / .env.local, or passed inline).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const BUILTIN_ADMIN_EMAILS = ["adam@mybenefitspa.com", "frank@mybenefitspa.com"];

const root = path.join(__dirname, "..");

function loadEnvFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Don't clobber values already present in the environment (e.g. inline MONGODB_URI).
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local");

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI (set it in .env / .env.local or pass it inline).");
  process.exit(1);
}

// Collect targets: built-ins + ADMIN_EMAILS + any CLI args, de-duped and normalized.
const fromEnv = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const fromArgs = process.argv
  .slice(2)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const emails = Array.from(new Set([...BUILTIN_ADMIN_EMAILS, ...fromEnv, ...fromArgs]));

// Minimal User schema — targets the same "users" collection the app uses. Only
// the fields we set are declared; `strict: false` leaves any others untouched.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true, trim: true },
    hashedPassword: String,
    emailVerified: Date,
    accountType: String,
    name: String,
    isAdmin: Boolean,
    status: String,
    onboardingStep: String,
  },
  { timestamps: true, strict: false },
);
const User = mongoose.models.User ?? mongoose.model("User", userSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const dbName = mongoose.connection.name;
  console.log(`Connected to database "${dbName}".\n`);

  for (const email of emails) {
    const existing = await User.findOne({ email });
    if (existing) {
      const changes = {};
      if (!existing.isAdmin) changes.isAdmin = true;
      if (existing.status === "disabled") changes.status = "active";
      if (Object.keys(changes).length) {
        await User.updateOne({ _id: existing._id }, { $set: changes });
        console.log(`↑ promoted  ${email}  (${Object.keys(changes).join(", ")})`);
      } else {
        console.log(`✓ already admin  ${email}`);
      }
      continue;
    }

    const name = email.split("@")[0].replace(/^./, (c) => c.toUpperCase());
    await User.create({
      email,
      // Valid bcrypt hash of a random secret nobody holds — sign-in is by code.
      hashedPassword: bcrypt.hashSync(crypto.randomBytes(24).toString("base64url"), 10),
      accountType: "fiduciary",
      name,
      isAdmin: true,
      status: "active",
      emailVerified: new Date(),
      onboardingStep: "complete",
    });
    console.log(`+ created   ${email}  (active admin, onboarded)`);
  }

  const total = await User.countDocuments({ isAdmin: true });
  console.log(`\nDone. ${total} admin${total === 1 ? "" : "s"} in "${dbName}".`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
