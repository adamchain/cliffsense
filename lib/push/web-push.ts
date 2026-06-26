/**
 * Web Push (VAPID) sender. Configures the web-push client from env and exposes
 * helpers to push to a single user's devices. Mirrors the email mailer's
 * never-throw contract: failures are logged and reported, not raised. Expired
 * subscriptions (404/410) are pruned so they don't accumulate.
 */
import webpush from "web-push";
import { connectDB } from "@/lib/db/mongodb";
import PushSubscription from "@/lib/db/models/PushSubscription";

let configured = false;

/** Returns true when VAPID keys are present and the client is ready. */
export function pushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:alerts@mybenefitspa.com",
    process.env.VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushResult = { sent: number; removed: number; skipped?: boolean };

/** Sends a push notification to every device subscription a user has. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (!ensureConfigured()) {
    return { sent: 0, removed: 0, skipped: true };
  }
  await connectDB();
  const subs = await PushSubscription.find({ userId }).lean();
  if (subs.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    if (!sub.keys?.p256dh || !sub.keys?.auth) {
      await PushSubscription.deleteOne({ _id: sub._id });
      removed += 1;
      continue;
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        body,
      );
      sent += 1;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // 404 Not Found / 410 Gone → the subscription is dead; drop it.
      if (status === 404 || status === 410) {
        await PushSubscription.deleteOne({ _id: sub._id });
        removed += 1;
      } else {
        console.warn("web-push send failed", status, (e as Error)?.message);
      }
    }
  }

  return { sent, removed };
}
