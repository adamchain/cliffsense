import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import { appUrl } from "@/lib/email/mailer";
import { wantsAlertType } from "@/lib/email/recipients";
import { pushConfigured, sendPushToUser } from "@/lib/push/web-push";
import User from "@/lib/db/models/User";

/**
 * Sends a Web Push notification for each new alert, honoring the user's per-type
 * opt-outs. Push is inherently realtime, so (unlike email) it fires for every
 * enabled alert regardless of digest cadence. Marks `pushSent` so retries of a
 * sync don't double-notify. Returns the number of alerts pushed.
 */
export async function sendAlertPushForNewAlerts(alertIds: string[]): Promise<number> {
  if (alertIds.length === 0 || !pushConfigured()) {
    return 0;
  }

  await connectDB();
  const oids = alertIds.map((id) => new mongoose.Types.ObjectId(id));
  const alerts = await Alert.find({ _id: { $in: oids }, pushSent: { $ne: true } }).lean();
  if (alerts.length === 0) {
    return 0;
  }

  let pushed = 0;
  for (const a of alerts) {
    const user = await User.findById(a.userId).select("notificationPrefs").lean();
    if (!wantsAlertType(user?.notificationPrefs, String(a.trigger ?? ""))) {
      continue;
    }
    const level = String(a.level ?? "info");
    const res = await sendPushToUser(String(a.userId), {
      title:
        level === "breach"
          ? "MyBenefitsPA: threshold reached"
          : "MyBenefitsPA: heads up",
      body: String(a.message ?? ""),
      url: `${appUrl()}/alerts`,
      tag: String(a._id),
    });
    if (res.skipped) {
      continue;
    }
    await Alert.updateOne({ _id: a._id }, { $set: { pushSent: true, pushSentAt: new Date() } });
    pushed += 1;
  }

  return pushed;
}
