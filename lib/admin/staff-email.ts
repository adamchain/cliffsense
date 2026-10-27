/** Company domain allowed to open the admin console. */
export const ADMIN_EMAIL_DOMAIN = "bene-watch.com";

/** True when the address is a real mailbox at the Bene-Watch domain. */
export function isBeneWatchAdminEmail(email: string): boolean {
  const value = email.toLowerCase().trim();
  const at = value.lastIndexOf("@");
  if (at < 1 || at !== value.indexOf("@")) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!local || local.startsWith(".") || local.endsWith(".")) return false;
  return domain === ADMIN_EMAIL_DOMAIN;
}
