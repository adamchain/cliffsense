import { connectDB } from "@/lib/db/mongodb";
import Task from "@/lib/db/models/Task";
import Beneficiary from "@/lib/db/models/Beneficiary";
import User from "@/lib/db/models/User";
import { appUrl, sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";
import { resolveRecipients } from "@/lib/email/recipients";

/**
 * Sends "due" emails for tasks/reminders whose dueAt has arrived, where the
 * owner opted into email and we have not already notified for this occurrence.
 * `lastNotifiedAt` guards against re-sending; recurring items reset it to null
 * when they roll forward, so each occurrence emails once. Designed to be called
 * on a schedule (see app/api/cron/reminders/route.ts). Returns the count sent.
 */
export async function dispatchDueReminders(now: Date = new Date()): Promise<number> {
  await connectDB();

  const due = await Task.find({
    status: "open",
    remindViaEmail: true,
    dueAt: { $ne: null, $lte: now },
    $or: [{ lastNotifiedAt: null }, { $expr: { $lt: ["$lastNotifiedAt", "$dueAt"] } }],
  })
    .limit(500)
    .lean();

  if (due.length === 0) return 0;

  // Cache lookups so many reminders for the same person/user don't refetch.
  const benNames = new Map<string, string>();
  const userRows = new Map<string, { email?: string; notificationPrefs?: unknown } | null>();
  let sent = 0;

  for (const t of due) {
    const benId = String(t.beneficiaryId);
    if (!benNames.has(benId)) {
      const ben = await Beneficiary.findById(benId).select("firstName lastName").lean();
      benNames.set(benId, ben ? `${ben.firstName ?? ""} ${ben.lastName ?? ""}`.trim() : "");
    }
    const userId = String(t.createdByUserId);
    if (!userRows.has(userId)) {
      userRows.set(
        userId,
        await User.findById(userId).select("email notificationPrefs").lean(),
      );
    }
    const user = userRows.get(userId);
    const recipients = resolveRecipients(
      user?.email,
      user?.notificationPrefs as Parameters<typeof resolveRecipients>[1],
    );
    if (recipients.length === 0) {
      // No deliverable address — still stamp so we don't re-scan forever.
      await Task.updateOne({ _id: t._id }, { $set: { lastNotifiedAt: now } });
      continue;
    }

    const who = benNames.get(benId);
    const label = t.kind === "reminder" ? "Reminder" : "Task due";
    const { html, text } = renderEmail({
      heading: t.title,
      preheader: `${label}${who ? ` for ${who}` : ""}`,
      paragraphs: [
        `${label}${who ? ` for ${who}` : ""}.`,
        ...(t.notes ? [String(t.notes)] : []),
      ],
      cta: { label: "Open in Bene-Watch", url: `${appUrl()}/tasks` },
      tone: t.priority === "high" ? "warning" : "info",
    });

    const res = await sendEmail({
      to: recipients,
      subject: `${label}: ${t.title}`,
      text,
      html,
    });
    if (res.ok || res.skipped) {
      await Task.updateOne({ _id: t._id }, { $set: { lastNotifiedAt: now } });
      sent += 1;
    }
  }

  return sent;
}
