import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieSecure } from "@/lib/admin/session-token";

/** End the admin session. The main-app login is left as it is. */
export async function POST() {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: adminCookieSecure(),
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
