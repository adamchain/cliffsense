import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import Alert from "@/lib/db/models/Alert";
import Invite from "@/lib/db/models/Invite";
import Transaction from "@/lib/db/models/Transaction";

const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminOverview = {
  users: {
    total: number;
    admins: number;
    disabled: number;
    onboardingComplete: number;
    newLast7: number;
    newLast30: number;
    activeLast30: number;
  };
  data: {
    beneficiaries: number;
    bankConnections: number;
    bankErrors: number;
    transactions: number;
  };
  attention: {
    openAlerts: number;
    breaches: number;
    pendingInvites: number;
    staleConnections: number;
  };
  signupsByDay: { date: string; count: number }[];
};

/** UTC yyyy-mm-dd for grouping/labeling day buckets. */
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Single round-trip-ish gather of platform health for the admin overview. Each
 * figure is a cheap count/aggregate; grouped here so the page stays declarative.
 */
export async function getAdminOverview(now: Date): Promise<AdminOverview> {
  await connectDB();
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const staleCutoff = new Date(now.getTime() - 3 * DAY_MS);
  const chartStart = new Date(now.getTime() - 13 * DAY_MS);
  chartStart.setUTCHours(0, 0, 0, 0);

  const [
    total,
    admins,
    disabled,
    onboardingComplete,
    newLast7,
    newLast30,
    activeLast30,
    beneficiaries,
    bankConnections,
    bankErrors,
    transactions,
    openAlerts,
    breaches,
    pendingInvites,
    staleConnections,
    signupAgg,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isAdmin: true }),
    User.countDocuments({ status: "disabled" }),
    User.countDocuments({ onboardingStep: "complete" }),
    User.countDocuments({ createdAt: { $gte: since7 } }),
    User.countDocuments({ createdAt: { $gte: since30 } }),
    User.countDocuments({ lastLoginAt: { $gte: since30 } }),
    Beneficiary.countDocuments({}),
    BankConnection.countDocuments({}),
    BankConnection.countDocuments({ status: { $in: ["login_required", "error"] } }),
    Transaction.estimatedDocumentCount(),
    Alert.countDocuments({ status: { $in: ["new", "acknowledged"] } }),
    Alert.countDocuments({ level: "breach", status: { $in: ["new", "acknowledged"] } }),
    Invite.countDocuments({ status: "pending", expiresAt: { $gt: now } }),
    BankConnection.countDocuments({
      status: "active",
      $or: [{ lastSyncAt: { $lt: staleCutoff } }, { lastSyncAt: null }],
    }),
    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: chartStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const byDay = new Map(signupAgg.map((r) => [r._id, r.count]));
  const signupsByDay: { date: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartStart.getTime() + i * DAY_MS);
    const key = isoDay(d);
    signupsByDay.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  return {
    users: {
      total,
      admins,
      disabled,
      onboardingComplete,
      newLast7,
      newLast30,
      activeLast30,
    },
    data: { beneficiaries, bankConnections, bankErrors, transactions },
    attention: { openAlerts, breaches, pendingInvites, staleConnections },
    signupsByDay,
  };
}

export const BANK_STATUS_ORDER = [
  "login_required",
  "error",
  "disconnected",
  "active",
] as const;
export type BankStatus = (typeof BANK_STATUS_ORDER)[number];

export const BANK_STATUS_LABEL: Record<BankStatus, string> = {
  login_required: "Login required",
  error: "Error",
  disconnected: "Disconnected",
  active: "Active",
};

/** Count of bank connections in each status, for the bank-health summary. */
export async function getBankStatusCounts(): Promise<Record<BankStatus, number>> {
  await connectDB();
  const rows = await BankConnection.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const out = { login_required: 0, error: 0, disconnected: 0, active: 0 } as Record<
    BankStatus,
    number
  >;
  for (const r of rows) {
    if (r._id in out) out[r._id as BankStatus] = r.count;
  }
  return out;
}
