import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";

/**
 * Page/server-component guard: resolve the session only for a real, non-
 * impersonating admin. Anyone else is bounced to the dashboard. The admin group
 * layout calls this once; individual pages can call it too (cheap — `auth()` is
 * request-cached) for defense-in-depth if rendered outside the group.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.isAdmin || session.user.impersonatorId) {
    redirect("/dashboard");
  }
  return session;
}
