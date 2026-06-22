import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import Beneficiary from "@/lib/db/models/Beneficiary";
import User from "@/lib/db/models/User";
import { appUrl, sendEmail, withDisclaimer } from "@/lib/email/mailer";

export type DigestAlert = { level: string; message: string; createdAt: Date };
export type DigestGroup = { beneficiaryName: string; alerts: DigestAlert[] };

const LEVEL_RANK: Record<string, number> = { breach: 2, warning: 1, info: 0 };

/** Pure: render the digest body. Exposed for unit testing. */
export function composeDigestText(groups: DigestGroup[], frequency: "daily" | "weekly"): string {
  const window = frequency === "weekly" ? "this week" : "today";
  const total = groups.reduce((n, g) => n + g.alerts.length, 0);
  const lines: string[] = [];
  lines.push(`You have ${total} new benefit-threshold ${total === 1 ? "alert" : "alerts"} ${window}.`);
  lines.push("");

  for (const g of groups) {
    if (g.alerts.length === 0) continue;
    lines.push(`${g.beneficiaryName}:`);
    const sorted = [...g.alerts].sort(
      (a, b) => (LEVEL_RANK[b.level] ?? 0) - (LEVEL_RANK[a.level] ?? 0),
    );
    for (const a of sorted) {
      const tag = a.level === "breach" ? "[Review]" : a.level === "warning" ? "[Watch]" : "[Info]";
      lines.push(`  ${tag} ${a.message}`);
    }
    lines.push("");
  }

  lines.push(`Open MyBenefitsPA: ${appUrl()}/alerts`);
  return withDisclaimer(lines.join("\n"));
}

/**
 * Builds and sends a digest to every user whose notification cadence matches
 * `frequency`, covering un-emailed alerts in the lookback window. Marks the
 * included alerts `emailSent` so realtime and digest paths never double-send.
 * Returns the number of digest emails sent.
 */
export async function sendDigestForFrequency(frequency: "daily" | "weekly"): Promise<number> {
  await connectDB();
  const windowDays = frequency === "weekly" ? 7 : 1;
  const since = new Date(Date.now() - windowDays * 86400000);

  const users = await User.find({ "notificationPrefs.frequency": frequency })
    .select("email")
    .lean();

  let sent = 0;
  for (const user of users) {
    const to = user.email?.trim();
    if (!to) continue;

    const accessRows = await BeneficiaryAccess.find({ userId: user._id, status: "active" })
      .select("beneficiaryId")
      .lean();
    const beneficiaryIds = accessRows.map((r) => r.beneficiaryId);
    if (beneficiaryIds.length === 0) continue;

    const alerts = await Alert.find({
      beneficiaryId: { $in: beneficiaryIds },
      emailSent: { $ne: true },
      status: { $in: ["new", "acknowledged"] },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (alerts.length === 0) continue;

    const names = new Map<string, string>();
    const benDocs = await Beneficiary.find({ _id: { $in: beneficiaryIds } })
      .select("firstName lastName")
      .lean();
    for (const b of benDocs) {
      names.set(String(b._id), `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() || "Beneficiary");
    }

    const byBen = new Map<string, DigestAlert[]>();
    for (const a of alerts) {
      const key = String(a.beneficiaryId);
      const list = byBen.get(key) ?? [];
      list.push({
        level: String(a.level ?? "info"),
        message: String(a.message ?? ""),
        createdAt: a.createdAt as Date,
      });
      byBen.set(key, list);
    }

    const groups: DigestGroup[] = [...byBen.entries()].map(([id, list]) => ({
      beneficiaryName: names.get(id) ?? "Beneficiary",
      alerts: list,
    }));

    const subject =
      frequency === "weekly" ? "MyBenefitsPA weekly summary" : "MyBenefitsPA daily summary";
    const res = await sendEmail({ to, subject, text: composeDigestText(groups, frequency) });
    if (!res.ok) continue;

    const ids = alerts.map((a) => a._id as mongoose.Types.ObjectId);
    await Alert.updateMany(
      { _id: { $in: ids } },
      { $set: { emailSent: true, emailSentAt: new Date() } },
    );
    sent += 1;
  }

  return sent;
}
