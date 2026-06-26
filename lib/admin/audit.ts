import type { Session } from "next-auth";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import AdminAuditLog, { type AdminAuditAction } from "@/lib/db/models/AdminAuditLog";

/**
 * Resolve the current session only if it belongs to a real admin who is NOT
 * currently impersonating someone. Returns null otherwise — callers map that to
 * a 401/403. Blocking while impersonating prevents privilege actions from being
 * taken in a "view-as" context.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!session.user.isAdmin) return null;
  if (session.user.impersonatorId) return null; // acting as someone else
  return session;
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
