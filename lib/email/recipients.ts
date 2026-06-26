/**
 * Resolves who an alert/digest email goes to and whether a given alert type is
 * opted in, from a user's notificationPrefs. The primary recipient is the
 * notify-email override if set, else the sign-in email; `additionalEmails` are
 * always copied on top.
 */
export type NotificationPrefsLike = {
  alertTypes?: { predictive?: boolean; breach?: boolean; trend?: boolean } | null;
  email?: string | null;
  additionalEmails?: string[] | null;
} | null | undefined;

export type AlertTrigger = "predictive" | "breach" | "trend";

/** All addresses that should receive a notification, de-duplicated. */
export function resolveRecipients(
  signInEmail: string | undefined | null,
  prefs: NotificationPrefsLike,
): string[] {
  const primary = (prefs?.email?.trim() || signInEmail?.trim() || "").toLowerCase();
  const extras = (prefs?.additionalEmails ?? [])
    .map((e) => e?.trim().toLowerCase())
    .filter((e): e is string => Boolean(e));
  const all = [primary, ...extras].filter(Boolean);
  return Array.from(new Set(all));
}

/** Whether the user wants emails for this alert trigger. Defaults to true. */
export function wantsAlertType(prefs: NotificationPrefsLike, trigger: string): boolean {
  const types = prefs?.alertTypes;
  if (!types) return true;
  const key = trigger as AlertTrigger;
  if (key !== "predictive" && key !== "breach" && key !== "trend") return true;
  return types[key] !== false;
}
