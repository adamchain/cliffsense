import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import User from "@/lib/db/models/User";
import { appUrl, sendEmail } from "@/lib/email/mailer";
import { resolveRecipients, wantsAlertType } from "@/lib/email/recipients";
import { renderEmail } from "@/lib/email/template";

/**
 * Sends one realtime email per new alert. Users on the "realtime" cadence get
 * every alert; daily/weekly users are batched into a digest (see digest.ts) and
 * only receive an immediate email for `breach`-level alerts. Marks
 * `emailSent` / `emailSentAt` so digests don't double-send.
 */
export async function sendAlertEmailsForNewAlerts(alertIds: string[]): Promise<number> {
  if (alertIds.length === 0) {
    return 0;
  }

  await connectDB();
  const oids = alertIds.map((id) => new mongoose.Types.ObjectId(id));
  const alerts = await Alert.find({
    _id: { $in: oids },
    emailSent: { $ne: true },
  }).lean();

  if (alerts.length === 0) {
    return 0;
  }

  let sent = 0;
  for (const a of alerts) {
    const user = await User.findById(a.userId).select("email notificationPrefs").lean();
    const recipients = resolveRecipients(user?.email, user?.notificationPrefs);
    if (recipients.length === 0) {
      continue;
    }
    // Respect the user's per-type opt-outs (predictive / breach / trend).
    if (!wantsAlertType(user?.notificationPrefs, String(a.trigger ?? ""))) {
      continue;
    }
    const frequency = String(user?.notificationPrefs?.frequency ?? "daily");
    const level = String(a.level ?? "info");
    if (frequency !== "realtime" && level !== "breach") {
      // Batched into the user's daily/weekly digest instead.
      continue;
    }

    const subject = `MyBenefitsPA: ${level === "breach" ? "Important" : "Heads up"} — threshold activity`;
    const { html, text } = renderEmail({
      heading: level === "breach" ? "A benefit threshold needs attention" : "Heads up on a benefit threshold",
      preheader: String(a.message ?? "").slice(0, 110),
      tone: level === "breach" ? "danger" : level === "warning" ? "warning" : "info",
      paragraphs: [String(a.message ?? "")],
      cta: { label: "View in MyBenefitsPA", url: `${appUrl()}/alerts` },
    });
    const res = await sendEmail({ to: recipients, subject, html, text });
    if (!res.ok) {
      continue;
    }
    await Alert.updateOne({ _id: a._id }, { $set: { emailSent: true, emailSentAt: new Date() } });
    sent += 1;
  }

  return sent;
}
