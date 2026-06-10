#!/usr/bin/env node
/**
 * Registers each persona in seeds/plaid-sandbox-users/ as a Plaid sandbox Item
 * using the `user_custom` override flow, then prints the resulting access_tokens.
 *
 * Optionally also writes a BankConnection row into CliffSense's MongoDB so the
 * persona shows up immediately in /accounts for a given signed-up user.
 *
 * Usage:
 *   npm run plaid:seed-users                                      # all personas, Plaid-only
 *   npm run plaid:seed-users -- safe-sarah maya                   # subset
 *   npm run plaid:seed-users -- --for=you@example.com             # also link to a user's primary beneficiary
 *   npm run plaid:seed-users -- breach-ben --for=you@example.com  # one persona, linked
 *   npm run plaid:seed-users -- disconnect-dan --reset-login      # flip to ITEM_LOGIN_REQUIRED
 *
 * Env required:
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV=sandbox
 *   For --for=...:  MONGODB_URI, PLAID_ENCRYPTION_KEY
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Configuration, PlaidApi, PlaidEnvironments, Products } = require("plaid");
let mongoose = null;

const root = path.join(__dirname, "..");
const seedsDir = path.join(root, "seeds", "plaid-sandbox-users");
const INSTITUTION_ID = process.env.PLAID_SANDBOX_INSTITUTION ?? "ins_109508"; // First Platypus Bank

function loadEnvFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local");

const clientId = process.env.PLAID_CLIENT_ID;
const secret = process.env.PLAID_SECRET;
const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
if (!clientId || !secret) {
  console.error("Missing PLAID_CLIENT_ID or PLAID_SECRET in .env / .env.local");
  process.exit(1);
}
if (env !== "sandbox") {
  console.error(`PLAID_ENV must be 'sandbox' for this script; got '${env}'.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const flags = new Set();
const forOpts = [];
const wanted = [];
for (const a of args) {
  if (a.startsWith("--for=")) forOpts.push(a.slice("--for=".length));
  else if (a.startsWith("--")) flags.add(a);
  else wanted.push(a);
}
const wantedSet = new Set(wanted);
const forEmail = forOpts[0] ?? null;

// ---------- Plaid ----------
const api = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } },
  }),
);

// ---------- Crypto (matches lib/plaid/crypto.ts) ----------
function encryptPlaidToken(plain) {
  const b64 = process.env.PLAID_ENCRYPTION_KEY;
  if (!b64) throw new Error("PLAID_ENCRYPTION_KEY missing (needed when using --for=)");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("PLAID_ENCRYPTION_KEY must decode to 32 bytes");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

// ---------- Mongoose (lazy, only when --for=) ----------
async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing (needed when using --for=)");
  }
  mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGODB_URI);
}

function defineModels() {
  const { Schema } = mongoose;

  const userSchema = new Schema({ email: String }, { strict: false, timestamps: true });
  const User =
    mongoose.models.User || mongoose.model("User", userSchema);

  const beneficiarySchema = new Schema(
    { ownerUserId: Schema.Types.ObjectId, isOwner: Boolean },
    { strict: false, timestamps: true },
  );
  const Beneficiary =
    mongoose.models.Beneficiary || mongoose.model("Beneficiary", beneficiarySchema);

  const accountSchema = new Schema(
    {
      plaidAccountId: String,
      name: String,
      mask: String,
      type: String,
      subtype: String,
      currentBalanceCents: Number,
      availableBalanceCents: Number,
    },
    { _id: false },
  );
  const bankConnectionSchema = new Schema(
    {
      beneficiaryId: { type: Schema.Types.ObjectId, required: true, index: true },
      plaidItemId: { type: String, required: true, unique: true },
      plaidAccessTokenEncrypted: { type: String, required: true },
      plaidInstitutionId: { type: String, default: "" },
      institutionName: { type: String, default: "" },
      accounts: { type: [accountSchema], default: [] },
      status: {
        type: String,
        enum: ["active", "login_required", "error", "disconnected"],
        default: "active",
      },
      lastSyncAt: { type: Date, default: null },
      syncCursor: { type: String, default: "" },
    },
    { timestamps: true },
  );
  const BankConnection =
    mongoose.models.BankConnection || mongoose.model("BankConnection", bankConnectionSchema);

  return { User, Beneficiary, BankConnection };
}

// ---------- Helpers ----------
function listPersonas() {
  if (!fs.existsSync(seedsDir)) {
    console.error(`Seeds directory missing: ${seedsDir}`);
    process.exit(1);
  }
  return fs
    .readdirSync(seedsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ stem: path.basename(f, ".json"), file: path.join(seedsDir, f) }));
}

function stripMetaForOverride(cfg) {
  const { seed, override_accounts } = cfg;
  return { seed, override_accounts };
}

function dollarsToCents(n) {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

async function seedPersona({ stem, file }, ctx) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const override = stripMetaForOverride(raw);
  const persona = raw.persona ?? stem;
  const summary = raw.summary ?? "";

  let publicToken;
  try {
    const res = await api.sandboxPublicTokenCreate({
      institution_id: INSTITUTION_ID,
      initial_products: [Products.Transactions],
      options: {
        override_username: "user_custom",
        override_password: JSON.stringify(override),
      },
    });
    publicToken = res.data.public_token;
  } catch (e) {
    console.error(`[${persona}] sandbox/public_token/create failed`, e.response?.data ?? e.message);
    return null;
  }

  let accessToken;
  let itemId;
  try {
    const res = await api.itemPublicTokenExchange({ public_token: publicToken });
    accessToken = res.data.access_token;
    itemId = res.data.item_id;
  } catch (e) {
    console.error(`[${persona}] item/public_token/exchange failed`, e.response?.data ?? e.message);
    return null;
  }

  let institutionName = "";
  try {
    const itemResp = await api.itemGet({ access_token: accessToken });
    const instId = itemResp.data.item.institution_id ?? "";
    if (instId) {
      const inst = await api.institutionsGetById({
        institution_id: instId,
        country_codes: ["US"],
      });
      institutionName = inst.data.institution.name;
    }
  } catch (e) {
    /* ignore */
  }

  let accounts = [];
  try {
    const res = await api.accountsGet({ access_token: accessToken });
    accounts = res.data.accounts.map((a) => ({
      plaidAccountId: a.account_id,
      name: a.name,
      official_name: a.official_name,
      mask: a.mask ?? "",
      type: String(a.type ?? ""),
      subtype: String(a.subtype ?? ""),
      currentBalanceCents: dollarsToCents(a.balances?.current),
      availableBalanceCents: dollarsToCents(a.balances?.available ?? a.balances?.current ?? 0),
    }));
  } catch (e) {
    console.error(`[${persona}] accounts/get failed`, e.response?.data ?? e.message);
  }

  let bankConnectionId = null;
  if (ctx) {
    try {
      const conn = await ctx.BankConnection.create({
        beneficiaryId: ctx.beneficiary._id,
        plaidItemId: itemId,
        plaidAccessTokenEncrypted: encryptPlaidToken(accessToken),
        plaidInstitutionId: "",
        institutionName: institutionName || "Plaid Sandbox Bank",
        accounts: accounts.map((a) => ({
          plaidAccountId: a.plaidAccountId,
          name: a.name,
          mask: a.mask,
          type: a.type,
          subtype: a.subtype,
          currentBalanceCents: a.currentBalanceCents,
          availableBalanceCents: a.availableBalanceCents,
        })),
        status: "active",
      });
      bankConnectionId = conn._id.toString();
    } catch (e) {
      console.error(`[${persona}] writing BankConnection failed:`, e.message);
    }
  }

  if (flags.has("--reset-login") || stem === "disconnect-dan") {
    try {
      await api.sandboxItemResetLogin({ access_token: accessToken });
      if (ctx && bankConnectionId) {
        await ctx.BankConnection.updateOne(
          { _id: bankConnectionId },
          { $set: { status: "login_required" } },
        );
      }
      console.error(`[${persona}] flipped to ITEM_LOGIN_REQUIRED`);
    } catch (e) {
      console.error(`[${persona}] reset_login failed`, e.response?.data ?? e.message);
    }
  }

  return {
    persona,
    summary,
    item_id: itemId,
    access_token: accessToken,
    institution_name: institutionName,
    bank_connection_id: bankConnectionId,
    accounts,
  };
}

(async () => {
  const personas = listPersonas().filter((p) =>
    wantedSet.size === 0
      ? true
      : Array.from(wantedSet).some((w) => p.stem.includes(w)),
  );
  if (personas.length === 0) {
    console.error("No matching personas. Available:");
    for (const p of listPersonas()) console.error(`  ${p.stem}`);
    process.exit(1);
  }

  let ctx = null;
  if (forEmail) {
    await connectMongo();
    const { User, Beneficiary, BankConnection } = defineModels();
    const user = await User.findOne({ email: forEmail.toLowerCase() }).select("_id email").lean();
    if (!user) {
      console.error(`No user with email ${forEmail}. Sign up at /auth/signup first.`);
      await mongoose.disconnect();
      process.exit(1);
    }
    const ben =
      (await Beneficiary.findOne({ ownerUserId: user._id, isOwner: true }).select("_id firstName lastName").lean()) ||
      (await Beneficiary.findOne({ ownerUserId: user._id }).select("_id firstName lastName").lean());
    if (!ben) {
      console.error(
        `No primary beneficiary for ${forEmail}. Complete the profile step in onboarding first.`,
      );
      await mongoose.disconnect();
      process.exit(1);
    }
    ctx = { user, beneficiary: ben, BankConnection };
    process.stderr.write(
      `Linking personas to ${forEmail} → beneficiary ${ben.firstName} ${ben.lastName} (${ben._id})\n`,
    );
  }

  const results = [];
  for (const p of personas) {
    process.stderr.write(`Seeding ${p.stem}…\n`);
    const r = await seedPersona(p, ctx);
    if (r) results.push(r);
  }

  if (ctx) {
    await mongoose.disconnect();
  }

  console.log(
    JSON.stringify(
      {
        institution_id: INSTITUTION_ID,
        linked_to: forEmail,
        next_steps: ctx
          ? "Open /accounts in the app and click Sync on each new connection to load transactions."
          : "Use /api/plaid/exchange with the public_token flow, or re-run with --for=<email> to wire the access_tokens directly into your account.",
        personas: results,
      },
      null,
      2,
    ),
  );
})();
