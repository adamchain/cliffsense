import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import AdminAuditLog, { type AdminAuditAction } from "@/lib/db/models/AdminAuditLog";
import { isBeneWatchAdminEmail } from "@/lib/admin/staff-email";
import {
  ADMIN_COOKIE_NAME,
  adminSessionSecret,
  readAdminSession,
} from "@/lib/admin/session-token";

/** Actor for an admin request. Independent of the main-app login. */
export type AdminActor = {
  user: { id: string; email: string };
};

/**
 * Resolve the admin console session from its own cookie. A main-app login,
 * including one with isAdmin, does not count. The address must still be a
 * live @bene-watch.com account.
 */
export async function getAdminSession(): Promise<AdminActor | null> {
  const secret = adminSessionSecret();
  if (!secret) return null;
  const store = await cookies();
  const claims = await readAdminSession(store.get(ADMIN_COOKIE_NAME)?.value, secret);
  if (!claims || !isBeneWatchAdminEmail(claims.email)) return null;

  await connectDB();
  const user = await User.findById(claims.uid).select("email status").lean();
  if (!user || user.status === "disabled") return null;
  if (user.email.toLowerCase() !== claims.email.toLowerCase()) return null;
  if (!isBeneWatchAdminEmail(user.email)) return null;
  return { user: { id: user._id.toString(), email: user.email } };
}

/** Best-effort client metadata for the audit record. */
export function clientMeta(req: Request): { ipAddress: string; userAgent: string } {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "";
  return { ipAddress: ip, userAgent: h.get("user-agent") ?? "" };
}

export async function logAdminAction(input: {
  actorUserId: string;
  actorEmail?: string | null;
  action: AdminAuditAction;
  targetUserId?: string | null;
  targetEmail?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await connectDB();
    await AdminAuditLog.create({
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail ?? "",
      action: input.action,
      targetUserId: input.targetUserId ?? null,
      targetEmail: input.targetEmail ?? "",
      details: input.details ?? {},
      ipAddress: input.ipAddress ?? "",
      userAgent: input.userAgent ?? "",
    });
  } catch (e) {
    console.error("logAdminAction failed", e);
  }
}
