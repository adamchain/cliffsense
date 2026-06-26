import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import Beneficiary from "@/lib/db/models/Beneficiary";
import User from "@/lib/db/models/User";
import { appUrl, sendEmail, withDisclaimer } from "@/lib/email/mailer";
import { resolveRecipients, wantsAlertType } from "@/lib/email/recipients";
import { BRAND, escapeHtml, renderEmail } from "@/lib/email/template";

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

const LEVEL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  breach: { label: "Review", color: "#a4262c", bg: "#fde7e9" },
  warning: { label: "Watch", color: "#c2740f", bg: "#fbe7cf" },
  info: { label: "Info", color: "#1b6cc4", bg: "#e3eefb" },
};

/** Pure: render the digest groups as branded inner HTML. Exposed for testing. */
export function composeDigestHtml(groups: DigestGroup[], frequency: "daily" | "weekly"): string {
  const window = frequency === "weekly" ? "this week" : "today";
  const total = groups.reduce((n, g) => n + g.alerts.length, 0);
  const parts: string[] = [];
  parts.push(
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.text};">You have <strong>${total}</strong> new benefit-threshold ${
      total === 1 ? "alert" : "alerts"
    } ${window}.</p>`,
  );

  for (const g of groups) {
    if (g.alerts.length === 0) continue;
    const sorted = [...g.alerts].sort(
      (a, b) => (LEVEL_RANK[b.level] ?? 0) - (LEVEL_RANK[a.level] ?? 0),
    );
    const rows = sorted
      .map((a) => {
        const badge = LEVEL_BADGE[a.level] ?? LEVEL_BADGE.info;
        return `<tr>
          <td style="padding:8px 10px 8px 0;vertical-align:top;white-space:nowrap;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:${badge.color};background:${badge.bg};">${badge.label}</span>
          </td>
          <td style="padding:8px 0;vertical-align:top;font-size:14px;line-height:1.5;color:${BRAND.text};">${escapeHtml(
            a.message,
          )}</td>
        </tr>`;
      })
      .join("");
    parts.push(
      `<div style="margin:0 0 18px;">
        <div style="margin:0 0 6px;font-size:13px;font-weight:700;color:${BRAND.navy};">${escapeHtml(
          g.beneficiaryName,
        )}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>`,
    );
  }
  return parts.join("");
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
    .select("email notificationPrefs")
    .lean();

  let sent = 0;
  for (const user of users) {
    const recipients = resolveRecipients(user.email, user.notificationPrefs);
    if (recipients.length === 0) continue;

    const accessRows = await BeneficiaryAccess.find({ userId: user._id, status: "active" })
      .select("beneficiaryId")
      .lean();
    const beneficiaryIds = accessRows.map((r) => r.beneficiaryId);
    if (beneficiaryIds.length === 0) continue;

    const allAlerts = await Alert.find({
      beneficiaryId: { $in: beneficiaryIds },
      emailSent: { $ne: true },
      status: { $in: ["new", "acknowledged"] },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .lean();
    // Honour per-type opt-outs; opted-out alerts are left un-emailed so a later
    // preference change can still surface them.
    const alerts = allAlerts.filter((a) =>
      wantsAlertType(user.notificationPrefs, String(a.trigger ?? "")),
    );
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
    const { html } = renderEmail({
      heading: frequency === "weekly" ? "Your weekly benefits summary" : "Your daily benefits summary",
      preheader: `${groups.reduce((n, g) => n + g.alerts.length, 0)} new threshold ${
        groups.reduce((n, g) => n + g.alerts.length, 0) === 1 ? "alert" : "alerts"
      }.`,
      bodyHtml: composeDigestHtml(groups, frequency),
      cta: { label: "Open MyBenefitsPA", url: `${appUrl()}/alerts` },
    });
    const res = await sendEmail({
      to: recipients,
      subject,
      html,
      text: composeDigestText(groups, frequency),
    });
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
