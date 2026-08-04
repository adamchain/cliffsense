#!/usr/bin/env node
/**
 * Create (or refresh) a fully seeded demo account that admins can open via
 * Admin → Users → "View as user". Idempotent — safe to re-run.
 *
 * Usage:
 *   npm run demo:seed
 *   npm run demo:seed -- someone@example.com
 *   DEMO_PASSWORD='Secret1!' npm run demo:seed
 *
 * Defaults:
 *   email    demo@mybenefitspa.com
 *   password Demo1234!
 *
 * Env: MONGODB_URI from .env / .env.local
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
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

const DEMO_EMAIL = (process.argv[2] || "demo@mybenefitspa.com").trim().toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo1234!";
const DEMO_NAME = "Maya Torres";

const empty = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User ?? mongoose.model("User", empty, "users");
const Beneficiary =
  mongoose.models.Beneficiary ?? mongoose.model("Beneficiary", empty, "beneficiaries");
const BeneficiaryAccess =
  mongoose.models.BeneficiaryAccess ??
  mongoose.model("BeneficiaryAccess", empty, "beneficiaryaccesses");
const BankConnection =
  mongoose.models.BankConnection ??
  mongoose.model("BankConnection", empty, "bankconnections");
const Transaction =
  mongoose.models.Transaction ?? mongoose.model("Transaction", empty, "transactions");
const RecurringStream =
  mongoose.models.RecurringStream ??
  mongoose.model("RecurringStream", empty, "recurringstreams");
const Alert = mongoose.models.Alert ?? mongoose.model("Alert", empty, "alerts");
const ReportingDeadline =
  mongoose.models.ReportingDeadline ??
  mongoose.model("ReportingDeadline", empty, "reportingdeadlines");
const VaultDocument =
  mongoose.models.VaultDocument ?? mongoose.model("VaultDocument", empty, "vaultdocuments");
const ActivityLog =
  mongoose.models.ActivityLog ?? mongoose.model("ActivityLog", empty, "activitylogs");
const Threshold =
  mongoose.models.Threshold ?? mongoose.model("Threshold", empty, "thresholds");

function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function mockId(seed) {
  return `demo:${crypto.createHash("sha1").update(`demo:${DEMO_EMAIL}:${seed}`).digest("hex").slice(0, 24)}`;
}

function monthsBack(from, n) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - n, 1));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

/** Build several months of payroll, SSI, SNAP, and everyday spend. */
function buildTransactions(now = new Date()) {
  const rows = [];
  const yNow = now.getUTCFullYear();
  const mNow = now.getUTCMonth() + 1;

  for (let back = 3; back >= 0; back--) {
    const { y, m } = monthsBack(now, back);
    // Biweekly payroll (~$850 net)
    for (const day of [3, 17]) {
      rows.push({
        date: iso(y, m, day),
        amountCents: -84850,
        name: "ADP PAYROLL DIRECT DEP",
        merchantName: "ADP",
        userCategory: "earned_income",
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_WAGES",
        category: "Payroll",
      });
    }
    // SSI
    rows.push({
      date: iso(y, m, 1),
      amountCents: -96700,
      name: "SSA TREAS 310 SSI",
      merchantName: "Social Security Administration",
      userCategory: "benefit_deposit",
      pfcPrimary: "INCOME",
      pfcDetailed: "INCOME_RETIREMENT_PENSION",
      category: "Government",
    });
    // SNAP EBT cash-out style deposit (illustrative)
    if (back <= 2) {
      rows.push({
        date: iso(y, m, 8),
        amountCents: -29100,
        name: "PA DHS SNAP",
        merchantName: "PA Department of Human Services",
        userCategory: "benefit_deposit",
        pfcPrimary: "INCOME",
        pfcDetailed: "INCOME_OTHER",
        category: "Government",
      });
    }
  }

  // Current-month expenses
  const expenses = [
    { day: 2, cents: 6240, name: "GIANT EAGLE #1234", merchant: "Giant Eagle" },
    { day: 4, cents: 1899, name: "SHELL OIL 574829", merchant: "Shell" },
    { day: 5, cents: 125000, name: "ACH RENT PHA", merchant: "Housing Authority" },
    { day: 7, cents: 4520, name: "PECO ENERGY", merchant: "PECO" },
    { day: 9, cents: 2199, name: "CVS/PHARMACY #8821", merchant: "CVS" },
    { day: 11, cents: 1499, name: "SEPTA KEY", merchant: "SEPTA" },
  ];
  for (const e of expenses) {
    rows.push({
      date: iso(yNow, mNow, Math.min(e.day, 28)),
      amountCents: e.cents,
      name: e.name,
      merchantName: e.merchant,
      userCategory: "expense",
      pfcPrimary: "GENERAL_MERCHANDISE",
      pfcDetailed: "GENERAL_MERCHANDISE_OTHER",
      category: "Shopping",
    });
  }

  // Transfer that heuristics can upgrade
  rows.push({
    date: iso(yNow, mNow === 1 ? yNow - 1 : yNow, mNow === 1 ? 12 : mNow - 1, 28),
    amountCents: -17500,
    name: "ACH CREDIT PAYCHEX PAYROLL",
    merchantName: "Paychex",
    userCategory: "transfer",
    pfcPrimary: "TRANSFER_IN",
    pfcDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
    category: "",
  });

  return rows;
}

async function upsertUser() {
  const hashedPassword = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const set = {
    email: DEMO_EMAIL,
    hashedPassword,
    emailVerified: new Date(),
    accountType: "beneficiary",
    name: DEMO_NAME,
    isAdmin: false,
    status: "active",
    applicationStatus: "approved",
    onboardingStep: "complete",
    notificationPrefs: {
      frequency: "realtime",
      alertTypes: {
        predictive: true,
        breach: true,
        trend: true,
        cliff: true,
        reporting: true,
        snt: true,
        able: true,
      },
      email: DEMO_EMAIL,
      additionalEmails: [],
    },
    lastLoginAt: new Date(),
  };
  const res = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    { $set: set },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return res;
}

async function upsertBeneficiary(userId) {
  const enrolledSince = utcDate(2023, 4, 1);
  const benefitsEnrolled = [
    { program: "SSI", enrolledSince, nextRenewalDate: utcDate(2026, 11, 15), contextData: {} },
    { program: "SSDI", enrolledSince: utcDate(2024, 1, 1), nextRenewalDate: null, contextData: {} },
    { program: "SNAP", enrolledSince, nextRenewalDate: utcDate(2026, 9, 30), contextData: {} },
    { program: "Medicaid", enrolledSince, nextRenewalDate: utcDate(2026, 10, 1), contextData: {} },
    { program: "Section8", enrolledSince: utcDate(2022, 8, 1), nextRenewalDate: utcDate(2026, 12, 1), contextData: {} },
    { program: "ABLE", enrolledSince: utcDate(2025, 2, 1), nextRenewalDate: null, contextData: {} },
    { program: "LIHEAP", enrolledSince: utcDate(2025, 11, 1), nextRenewalDate: utcDate(2026, 9, 1), contextData: {} },
  ];

  const existing = await Beneficiary.findOne({ ownerUserId: userId, isOwner: true });
  if (existing) {
    await Beneficiary.updateOne(
      { _id: existing._id },
      {
        $set: {
          firstName: "Maya",
          lastName: "Torres",
          dateOfBirth: utcDate(1989, 6, 14),
          state: "PA",
          county: "Philadelphia",
          householdSize: 1,
          benefitsEnrolled,
          detachedThresholdKeys: [],
        },
      },
    );
    return existing._id;
  }

  const created = await Beneficiary.create({
    ownerUserId: userId,
    isOwner: true,
    firstName: "Maya",
    lastName: "Torres",
    dateOfBirth: utcDate(1989, 6, 14),
    state: "PA",
    county: "Philadelphia",
    householdSize: 1,
    benefitsEnrolled,
    detachedThresholdKeys: [],
  });
  return created._id;
}

async function ensureAccess(beneficiaryId, userId) {
  const now = new Date();
  await BeneficiaryAccess.updateOne(
    { beneficiaryId, userId },
    {
      $setOnInsert: {
        beneficiaryId,
        userId,
        invitedAt: now,
        acceptedAt: now,
        invitedByUserId: null,
      },
      $set: { status: "active", role: "owner" },
    },
    { upsert: true },
  );
}

async function upsertBank(beneficiaryId) {
  const plaidItemId = `demo-item:${beneficiaryId.toString()}`;
  const accounts = [
    {
      plaidAccountId: `demo-chk-${beneficiaryId.toString().slice(-6)}`,
      name: "Everyday Checking",
      mask: "4242",
      type: "depository",
      subtype: "checking",
      currentBalanceCents: 61240,
      availableBalanceCents: 61240,
    },
    {
      plaidAccountId: `demo-sav-${beneficiaryId.toString().slice(-6)}`,
      name: "Rainy Day Savings",
      mask: "8810",
      type: "depository",
      subtype: "savings",
      // ~92% of SSI $2,000 individual resource limit across both accounts
      currentBalanceCents: 122800,
      availableBalanceCents: 122800,
    },
  ];

  const res = await BankConnection.findOneAndUpdate(
    { plaidItemId },
    {
      $set: {
        beneficiaryId,
        source: "import",
        plaidItemId,
        plaidAccessTokenEncrypted: "",
        plaidInstitutionId: "demo_ins",
        institutionName: "Demo Credit Union",
        status: "active",
        accounts,
        lastSyncAt: new Date(),
        syncCursor: "",
      },
    },
    { upsert: true, new: true },
  );
  return res._id;
}

async function upsertTransactions(beneficiaryId, bankConnectionId) {
  const rows = buildTransactions(new Date());
  const ops = rows.map((r, i) => {
    const plaidTransactionId = mockId(`${r.date}|${r.amountCents}|${r.name}|${i}`);
    return {
      updateOne: {
        filter: { beneficiaryId, plaidTransactionId },
        update: {
          $set: {
            beneficiaryId,
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
            notes: "Demo seed",
            lastUserEditedAt: null,
          },
        },
        upsert: true,
      },
    };
  });
  const result = await Transaction.bulkWrite(ops, { ordered: false });
  return { count: rows.length, result };
}

async function upsertRecurring(beneficiaryId, bankConnectionId) {
  const streams = [
    {
      plaidStreamId: mockId("stream:payroll"),
      description: "ADP Payroll",
      merchantName: "ADP",
      type: "inflow",
      averageAmountCents: 84850,
      lastAmountCents: 84850,
      frequency: "biweekly",
      status: "mature",
      userCategory: "earned_income",
      isConfirmed: true,
      firstDate: iso(2025, 11, 3),
      lastDate: iso(2026, 8, 3),
      predictedNextDate: iso(2026, 8, 17),
      predictedNextAmountCents: 84850,
    },
    {
      plaidStreamId: mockId("stream:ssi"),
      description: "SSI deposit",
      merchantName: "Social Security Administration",
      type: "inflow",
      averageAmountCents: 96700,
      lastAmountCents: 96700,
      frequency: "monthly",
      status: "mature",
      userCategory: "benefit_deposit",
      isConfirmed: true,
      firstDate: iso(2024, 1, 1),
      lastDate: iso(2026, 8, 1),
      predictedNextDate: iso(2026, 9, 1),
      predictedNextAmountCents: 96700,
    },
    {
      plaidStreamId: mockId("stream:rent"),
      description: "PHA rent",
      merchantName: "Housing Authority",
      type: "outflow",
      averageAmountCents: 125000,
      lastAmountCents: 125000,
      frequency: "monthly",
      status: "mature",
      userCategory: "rent",
      isConfirmed: true,
      firstDate: iso(2024, 8, 5),
      lastDate: iso(2026, 8, 5),
      predictedNextDate: iso(2026, 9, 5),
      predictedNextAmountCents: 125000,
    },
  ];

  for (const s of streams) {
    await RecurringStream.updateOne(
      { beneficiaryId, plaidStreamId: s.plaidStreamId },
      {
        $set: {
          beneficiaryId,
          bankConnectionId,
          ...s,
          excludedFromThresholds: false,
          excludeReason: "",
        },
      },
      { upsert: true },
    );
  }
  return streams.length;
}

async function upsertDeadlines(beneficiaryId, userId) {
  const items = [
    {
      sourceKey: "renewal:SSI",
      program: "SSI",
      kind: "renewal",
      dueDate: utcDate(2026, 11, 15),
      title: "SSI redetermination packet due",
      note: "Return the mailed redetermination forms to SSA.",
      track: "scheduled",
    },
    {
      sourceKey: "renewal:SNAP",
      program: "SNAP",
      kind: "renewal",
      dueDate: utcDate(2026, 9, 30),
      title: "SNAP recertification",
      note: "Complete MyCOMPASS PA renewal before benefits stop.",
      track: "scheduled",
    },
    {
      sourceKey: "renewal:MEDICAID",
      program: "MEDICAID",
      kind: "renewal",
      dueDate: utcDate(2026, 10, 1),
      title: "Medicaid renewal",
      note: "Watch for the DHS renewal notice.",
      track: "scheduled",
    },
    {
      sourceKey: "renewal:SECTION8",
      program: "SECTION8",
      kind: "renewal",
      dueDate: utcDate(2026, 12, 1),
      title: "Section 8 annual recertification",
      note: "Submit income paperwork to the housing authority.",
      track: "scheduled",
    },
    {
      sourceKey: "demo:ssi-wage-aug",
      program: "SSI",
      kind: "sar",
      dueDate: utcDate(2026, 8, 6),
      title: "SSI monthly wage report (July wages)",
      note: "Report July gross wages via SSI Mobile Wage / myWageReport.",
      track: "scheduled",
    },
    {
      sourceKey: "demo:cao-appt",
      program: "SNAP",
      kind: "appointment",
      dueDate: utcDate(2026, 8, 20),
      title: "County Assistance Office appointment",
      note: "Bring photo ID and latest award letter.",
      track: "event",
    },
  ];

  for (const item of items) {
    await ReportingDeadline.updateOne(
      { beneficiaryId, sourceKey: item.sourceKey },
      {
        $set: {
          beneficiaryId,
          userId,
          program: item.program,
          dueDate: item.dueDate,
          track: item.track,
          kind: item.kind,
          sourceKey: item.sourceKey,
          title: item.title,
          note: item.note,
          completedAt: null,
        },
      },
      { upsert: true },
    );
  }
  return items.length;
}

async function upsertAlerts(beneficiaryId, userId) {
  // Wipe prior demo-seeded alerts so re-runs stay tidy, then insert a fresh set.
  await Alert.deleteMany({
    beneficiaryId,
    "dataSnapshot.demoSeed": true,
  });

  const alerts = [
    {
      level: "warning",
      trigger: "predictive",
      message:
        "SSI resources are at about 92% of the $2,000 individual limit across checking and savings. Move excess into an ABLE account or spend down before month-end.",
      dataSnapshot: {
        demoSeed: true,
        program: "SSI",
        pct: 0.92,
        currentCents: 184040,
        limitCents: 200000,
      },
    },
    {
      level: "warning",
      trigger: "predictive",
      message:
        "Earned income this month is approaching the SSI countable-income warning line. Confirm July gross wages are reported by the 6th.",
      dataSnapshot: {
        demoSeed: true,
        program: "SSI",
        metric: "monthly_earned_income",
        pct: 0.88,
      },
    },
    {
      level: "info",
      trigger: "reporting",
      message: "SNAP recertification is due September 30, 2026. Start the MyCOMPASS PA renewal early.",
      dataSnapshot: { demoSeed: true, program: "SNAP", dueDate: "2026-09-30" },
    },
    {
      level: "info",
      trigger: "able",
      message:
        "ABLE contribution room remains available this year — deposits into PA ABLE generally do not count toward the SSI resource limit.",
      dataSnapshot: { demoSeed: true, program: "ABLE" },
    },
    {
      level: "breach",
      trigger: "cliff",
      status: "acknowledged",
      message:
        "A one-time Paychex deposit was tagged as a transfer. Review it — if it is wages, recategorize so SSI earned-income tracking stays accurate.",
      dataSnapshot: { demoSeed: true, program: "SSI", kind: "uncategorized_payroll" },
      acknowledgedAt: new Date(),
    },
  ];

  for (const a of alerts) {
    await Alert.create({
      beneficiaryId,
      userId,
      thresholdId: null,
      level: a.level,
      trigger: a.trigger,
      message: a.message,
      dataSnapshot: a.dataSnapshot,
      status: a.status || "new",
      emailSent: false,
      pushSent: false,
      acknowledgedAt: a.acknowledgedAt || null,
    });
  }
  return alerts.length;
}

async function upsertVault(beneficiaryId, userId) {
  await VaultDocument.deleteMany({
    beneficiaryId,
    filename: { $regex: /^demo-/ },
  });

  const docs = [
    {
      category: "disability_proof",
      filename: "demo-ssi-award-letter.txt",
      mimeType: "text/plain",
      body: "DEMO — SSI Award Letter\nMaya Torres\nMonthly payment: $967.00\nEffective: 2026-01-01\nInformational sample only.\n",
    },
    {
      category: "job_income",
      filename: "demo-july-paystub.txt",
      mimeType: "text/plain",
      body: "DEMO — Pay Stub\nEmployer: City Cafe LLC via ADP\nPay period: 2026-07-01 to 2026-07-15\nGross wages: $1,050.00\nNet deposit: $848.50\n",
    },
    {
      category: "correspondence",
      filename: "demo-snap-renewal-notice.txt",
      mimeType: "text/plain",
      body: "DEMO — SNAP Renewal Notice\nCounty Assistance Office — Philadelphia\nRenew by: 2026-09-30\nSubmit via MyCOMPASS PA.\n",
    },
    {
      category: "able_snt",
      filename: "demo-able-statement.txt",
      mimeType: "text/plain",
      body: "DEMO — PA ABLE account statement\nBalance: $1,240.00\nYTD contributions: $400.00\n",
    },
  ];

  for (const d of docs) {
    await VaultDocument.create({
      beneficiaryId,
      userId,
      category: d.category,
      transactionId: null,
      filename: d.filename,
      mimeType: d.mimeType,
      sizeBytes: Buffer.byteLength(d.body),
      content: Buffer.from(d.body, "utf8"),
      scanStatus: "clean",
    });
  }
  return docs.length;
}

async function upsertActivity(userId, beneficiaryId) {
  await ActivityLog.deleteMany({ userId, "details.demoSeed": true });
  const events = [
    { category: "auth", action: "auth.login", details: { method: "demo-seed" } },
    { category: "bank", action: "bank.connected", details: { institution: "Demo Credit Union" } },
    { category: "transaction", action: "transaction.synced", details: { count: 40 } },
    { category: "alert", action: "alert.created", details: { level: "warning" } },
    { category: "vault", action: "vault.uploaded", details: { filename: "demo-ssi-award-letter.txt" } },
  ];
  for (const e of events) {
    await ActivityLog.create({
      userId,
      beneficiaryId,
      sessionId: "demo-seed",
      category: e.category,
      action: e.action,
      resourceType: "",
      resourceId: "",
      details: { ...e.details, demoSeed: true },
      ipAddress: "127.0.0.1",
      userAgent: "seed-demo-user",
      severity: "info",
    });
  }
  return events.length;
}

/** Seed a few high-visibility system thresholds if the collection is empty. */
async function ensureCoreThresholds() {
  const count = await Threshold.countDocuments({ scope: "system" });
  if (count > 0) {
    return { skipped: true, count };
  }
  const seeds = [
    {
      systemKey: "ssi_resources_individual_2026",
      program: "SSI",
      thresholdType: "asset_balance",
      limitCents: 200000,
      label: "SSI resource limit (individual)",
      description: "Federal SSI countable resource limit for an individual.",
    },
    {
      systemKey: "ssi_countable_income_2026",
      program: "SSI",
      thresholdType: "monthly_unearned_income",
      limitCents: 96700,
      label: "SSI Federal Benefit Rate (individual)",
      description: "2026 SSI FBR individual.",
    },
    {
      systemKey: "ssdi_sga_nonblind_2026",
      program: "SSDI",
      thresholdType: "monthly_earned_income",
      limitCents: 162000,
      label: "SSDI SGA (non-blind)",
      description: "2026 Substantial Gainful Activity — non-blind.",
    },
    {
      systemKey: "snap_gross_hh1_pa_fy2026",
      program: "SNAP",
      state: "PA",
      thresholdType: "monthly_gross_income",
      limitCents: 260900,
      label: "SNAP gross income (HH of 1)",
      description: "PA SNAP gross income test, household of 1.",
    },
  ];
  for (const s of seeds) {
    await Threshold.updateOne(
      { systemKey: s.systemKey },
      {
        $set: {
          scope: "system",
          ownerUserId: null,
          beneficiaryId: null,
          program: s.program,
          state: s.state || null,
          thresholdType: s.thresholdType,
          limitCents: s.limitCents,
          comparison: "lte",
          warnAtPercent: 0.85,
          effectiveFrom: utcDate(2026, 1, 1),
          effectiveTo: null,
          label: s.label,
          description: s.description,
          sourceUrl: "",
          systemKey: s.systemKey,
          overriddenByAdminAt: null,
        },
      },
      { upsert: true },
    );
  }
  return { skipped: false, count: seeds.length };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to "${mongoose.connection.name}"\n`);

  const user = await upsertUser();
  console.log(`✓ User          ${user.email}  (${user._id})`);

  const beneficiaryId = await upsertBeneficiary(user._id);
  console.log(`✓ Beneficiary   Maya Torres  (${beneficiaryId})`);

  await ensureAccess(beneficiaryId, user._id);
  console.log(`✓ Access        owner`);

  const bankId = await upsertBank(beneficiaryId);
  console.log(`✓ Bank          Demo Credit Union  (${bankId})`);

  const tx = await upsertTransactions(beneficiaryId, bankId);
  console.log(
    `✓ Transactions  ${tx.count} rows  (upserted=${tx.result.upsertedCount} modified=${tx.result.modifiedCount})`,
  );

  const streams = await upsertRecurring(beneficiaryId, bankId);
  console.log(`✓ Recurring     ${streams} streams`);

  const deadlines = await upsertDeadlines(beneficiaryId, user._id);
  console.log(`✓ Deadlines     ${deadlines}`);

  const alerts = await upsertAlerts(beneficiaryId, user._id);
  console.log(`✓ Alerts        ${alerts}`);

  const docs = await upsertVault(beneficiaryId, user._id);
  console.log(`✓ Vault         ${docs} documents`);

  const activity = await upsertActivity(user._id, beneficiaryId);
  console.log(`✓ Activity      ${activity} events`);

  const thr = await ensureCoreThresholds();
  console.log(
    thr.skipped
      ? `✓ Thresholds    system already seeded (${thr.count})`
      : `✓ Thresholds    seeded ${thr.count} core system rows`,
  );

  console.log(`
────────────────────────────────────────
Demo account ready for admin impersonation

  Email:    ${DEMO_EMAIL}
  Password: ${DEMO_PASSWORD}
  Name:     ${DEMO_NAME}
  Programs: SSI, SSDI, SNAP, Medicaid, Section 8, ABLE, LIHEAP

Open as admin → /admin/users → search "${DEMO_EMAIL}" → View as user
Or sign in directly at /auth/signin with the password above.
────────────────────────────────────────`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
