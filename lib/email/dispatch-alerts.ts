import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import User from "@/lib/db/models/User";

/**
 * Sends one email per new alert when `RESEND_API_KEY` is set.
 * Marks `emailSent` / `emailSentAt` on success. Swallows provider errors.
 */
export async function sendAlertEmailsForNewAlerts(alertIds: string[]): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || alertIds.length === 0) {
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
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "CliffSense <onboarding@resend.dev>";

  for (const a of alerts) {
    const user = await User.findById(a.userId).select("email").lean();
    const to = user?.email?.trim();
    if (!to) {
      continue;
    }
    const level = String(a.level ?? "info");
    const subject = `CliffSense: ${level === "breach" ? "Important" : "Heads up"} — threshold activity`;
    try {
      const { error } = await resend.emails.send({
        from,
        to,
        subject,
        text: `${a.message as string}\n\n— CliffSense (informational only; confirm with a qualified counselor or agency.)`,
      });
      if (error) {
        console.warn("resend.emails.send", error);
        continue;
      }
      await Alert.updateOne(
        { _id: a._id },
        { $set: { emailSent: true, emailSentAt: new Date() } },
      );
      sent += 1;
    } catch (e) {
      console.warn("sendAlertEmailsForNewAlerts", e);
    }
  }

  return sent;
}
