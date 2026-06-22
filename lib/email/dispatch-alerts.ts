import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import User from "@/lib/db/models/User";
import { sendEmail, withDisclaimer } from "@/lib/email/mailer";

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
    const to = user?.email?.trim();
    if (!to) {
      continue;
    }
    const frequency = String(user?.notificationPrefs?.frequency ?? "daily");
    const level = String(a.level ?? "info");
    if (frequency !== "realtime" && level !== "breach") {
      // Batched into the user's daily/weekly digest instead.
      continue;
    }

    const subject = `MyBenefitsPA: ${level === "breach" ? "Important" : "Heads up"} — threshold activity`;
    const res = await sendEmail({ to, subject, text: withDisclaimer(a.message as string) });
    if (!res.ok) {
      continue;
    }
    await Alert.updateOne({ _id: a._id }, { $set: { emailSent: true, emailSentAt: new Date() } });
    sent += 1;
  }

  return sent;
}
