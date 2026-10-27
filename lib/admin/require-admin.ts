import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession, type AdminActor } from "@/lib/admin/audit";
import { ADMIN_COOKIE_NAME, adminCookieSecure } from "@/lib/admin/session-token";

/**
 * Page guard for the admin console. Missing or stale sessions go to the admin
 * sign-in page, never into the main app.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const session = await getAdminSession();
  if (!session) {
    const store = await cookies();
    store.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: adminCookieSecure(),
      maxAge: 0,
    });
    redirect("/admin/login");
  }
  return session;
}
