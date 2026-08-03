#!/usr/bin/env node
/**
 * Seed realistic mock bank transactions for a user so earned-income limits light up.
 *
 * Usage:
 *   node scripts/seed-mock-transactions.cjs
 *   node scripts/seed-mock-transactions.cjs adam@mybenefitspa.com
 *
 * Env: MONGODB_URI from .env / .env.local
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const root = path.join(__dirname, "..");

function loadEnvFile(rel, { overwrite = false } = {}) {
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
    if (overwrite || process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local", { overwrite: true });

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const email = (process.argv[2] || "adam@mybenefitspa.com").trim().toLowerCase();

const User = mongoose.models.User ?? mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");
const Beneficiary =
  mongoose.models.Beneficiary ??
  mongoose.model("Beneficiary", new mongoose.Schema({}, { strict: false }), "beneficiaries");
const BeneficiaryAccess =
  mongoose.models.BeneficiaryAccess ??
  mongoose.model("BeneficiaryAccess", new mongoose.Schema({}, { strict: false }), "beneficiaryaccesses");
const BankConnection =
  mongoose.models.BankConnection ??
  mongoose.model("BankConnection", new mongoose.Schema({}, { strict: false }), "bankconnections");
const Transaction =
  mongoose.models.Transaction ??
  mongoose.model("Transaction", new mongoose.Schema({}, { strict: false }), "transactions");

function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function mockId(seed) {
  const hash = crypto.createHash("sha1").update(`mock:${email}:${seed}`).digest("hex").slice(0, 24);
  return `mock:${hash}`;
}

/** Build July + August 2026 deposits that benefits should detect. */
function buildMockRows(y = 2026) {
  const rows = [];

  // Prior month (July) — what SSI wage report early August covers
  const julyPays = [
    { day: 3, cents: -84250, name: "ADP PAYROLL DIRECT DEP", merchant: "ADP", cat: "earned_income", pfc: ["INCOME", "INCOME_WAGES"] },
    { day: 17, cents: -84250, name: "ADP PAYROLL DIRECT DEP", merchant: "ADP", cat: "earned_income", pfc: ["INCOME", "INCOME_WAGES"] },
  ];
  for (const p of julyPays) {
    rows.push({
      date: iso(y, 7, p.day),
      amountCents: p.cents,
      name: p.name,
      merchantName: p.merchant,
      userCategory: p.cat,
      pfcPrimary: p.pfc[0],
      pfcDetailed: p.pfc[1],
      category: "Payroll",
    });
  }
  rows.push({
    date: iso(y, 7, 1),
    amountCents: -96700,
    name: "SSA TREAS 310 SSI",
    merchantName: "Social Security Administration",
    userCategory: "benefit_deposit",
    pfcPrimary: "INCOME",
    pfcDetailed: "INCOME_RETIREMENT_PENSION",
    category: "Government",
  });

  // Current month (August)
  rows.push({
    date: iso(y, 8, 1),
    amountCents: -85120,
    name: "GUSTO PAYROLL",
    merchantName: "Gusto",
    userCategory: "earned_income",
    pfcPrimary: "TRANSFER_IN",
    pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
    category: "Payroll",
  });
  rows.push({
    date: iso(y, 8, 1),
    amountCents: -96700,
    name: "SSA TREAS 310 SSI",
    merchantName: "Social Security Administration",
    userCategory: "benefit_deposit",
    pfcPrimary: "INCOME",
    pfcDetailed: "INCOME_RETIREMENT_PENSION",
    category: "Government",
  });

  // Everyday spend (does not count toward earned income)
  const expenses = [
    { day: 2, cents: 4523, name: "GIANT EAGLE #1234", merchant: "Giant Eagle" },
    { day: 2, cents: 1899, name: "SHELL OIL 574829", merchant: "Shell" },
    { day: 1, cents: 12500, name: "VENMO *RENT SHARE", merchant: "Venmo" },
  ];
  for (const e of expenses) {
    rows.push({
      date: iso(y, 8, e.day),
      amountCents: e.cents,
      name: e.name,
      merchantName: e.merchant,
      userCategory: "expense",
      pfcPrimary: "FOOD_AND_DRINK",
      pfcDetailed: "FOOD_AND_DRINK_GROCERIES",
      category: "Shopping",
    });
  }

  // One unclear transfer that heuristics should upgrade to earned on reapply (extra pay)
  rows.push({
    date: iso(y, 7, 31),
    amountCents: -15000,
    name: "ACH CREDIT PAYCHEX PAYROLL",
    merchantName: "Paychex",
    userCategory: "transfer",
    pfcPrimary: "TRANSFER_IN",
    pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
    category: "",
  });

  return rows;
}

async function resolveBeneficiary(userId) {
  const owned = await Beneficiary.findOne({ ownerUserId: userId }).sort({ createdAt: 1 }).lean();
  if (owned) return owned;
  const access = await BeneficiaryAccess.findOne({ userId, status: "active" }).lean();
  if (access?.beneficiaryId) {
    return Beneficiary.findById(access.beneficiaryId).lean();
  }
  return null;
}

async function getOrCreateMockConnection(beneficiaryId) {
  const plaidItemId = `mock:${beneficiaryId.toString()}`;
  let conn = await BankConnection.findOne({ plaidItemId }).lean();
  if (conn) return conn._id;
  const created = await BankConnection.create({
    beneficiaryId,
    source: "import",
    plaidItemId,
    plaidAccessTokenEncrypted: "",
    institutionName: "Mock checking (demo)",
    status: "active",
    accounts: [
      {
        plaidAccountId: `mock-acct-${beneficiaryId.toString().slice(-6)}`,
        name: "Everyday Checking",
        officialName: "Mock Everyday Checking",
        type: "depository",
        subtype: "checking",
        mask: "4242",
        currentBalanceCents: 184250,
        availableBalanceCents: 184250,
        currency: "USD",
      },
    ],
  });
  return created._id;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to "${mongoose.connection.name}"`);

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }
  console.log(`User: ${user.email} (${user._id})`);

  const beneficiary = await resolveBeneficiary(user._id);
  if (!beneficiary) {
    console.error("No beneficiary linked to this user. Finish onboarding first.");
    process.exit(1);
  }
  console.log(`Beneficiary: ${beneficiary.firstName} ${beneficiary.lastName} (${beneficiary._id})`);
  if (Array.isArray(beneficiary.benefitsEnrolled) && beneficiary.benefitsEnrolled.length) {
    console.log(
      `Programs: ${beneficiary.benefitsEnrolled.map((b) => b.program).join(", ")}`,
    );
  } else {
    console.log("Programs: (none enrolled — limits may stay empty until benefits are set)");
  }

  const bankConnectionId = await getOrCreateMockConnection(beneficiary._id);
  const rows = buildMockRows(2026);

  const ops = rows.map((r, i) => {
    const plaidTransactionId = mockId(`${r.date}|${r.amountCents}|${r.name}|${i}`);
    return {
      updateOne: {
        filter: { beneficiaryId: beneficiary._id, plaidTransactionId },
        update: {
          $set: {
            beneficiaryId: beneficiary._id,
            bankConnectionId,
            source: "import",
            plaidTransactionId,
            date: r.date,
            postedDate: r.date,
            amountCents: r.amountCents,
            currency: "USD",
            name: r.name,
            merchantName: r.merchantName,
            category: r.category,
            plaidCategory: r.category,
            pfcPrimary: r.pfcPrimary,
            pfcDetailed: r.pfcDetailed,
            pending: false,
            userCategory: r.userCategory,
            excludedFromThresholds: false,
            excludeReason: "",
            notes: "Mock seed for demo",
            lastUserEditedAt: null,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Transaction.bulkWrite(ops, { ordered: false });
  const earned = rows.filter((r) => r.userCategory === "earned_income");
  const julyEarned = earned
    .filter((r) => r.date.startsWith("2026-07"))
    .reduce((s, r) => s + Math.abs(r.amountCents), 0);
  const augEarned = earned
    .filter((r) => r.date.startsWith("2026-08"))
    .reduce((s, r) => s + Math.abs(r.amountCents), 0);

  console.log(
    `Upserted mock txs: matched=${result.matchedCount} modified=${result.modifiedCount} upserted=${result.upsertedCount}`,
  );
  console.log(`July earned (net deposits): $${(julyEarned / 100).toFixed(2)}`);
  console.log(`August earned (net deposits): $${(augEarned / 100).toFixed(2)}`);
  console.log("Done. Refresh Limits / Money to see them.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
