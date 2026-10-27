import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { isBeneWatchAdminEmail } from "@/lib/admin/staff-email";
import { connectDB } from "@/lib/db/mongodb";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  adminCookieSecure,
  adminSessionSecret,
  signAdminSession,
} from "@/lib/admin/session-token";
import { consumeAdminLoginCode } from "@/lib/auth/tokens";
import User from "@/lib/db/models/User";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

/** Turn a valid emailed code into the admin session cookie. */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "admin-login-verify", 10, 15 * 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const secret = adminSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: "Admin sign-in is not configured." }, { status: 500 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (!isBeneWatchAdminEmail(email)) {
    return NextResponse.json({ error: "That code is invalid or expired." }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email }).select("email status emailVerified");
  if (!user || user.status === "disabled") {
    return NextResponse.json({ error: "That code is invalid or expired." }, { status: 401 });
  }

  const code = parsed.data.code.replace(/\D/g, "");
  const ok = code.length === 6 && (await consumeAdminLoginCode(user._id, code));
  if (!ok) {
    return NextResponse.json({ error: "That code is invalid or expired." }, { status: 401 });
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isAdmin: true,
        emailVerified: user.emailVerified ?? new Date(),
        lastLoginAt: new Date(),
      },
    },
  );

  const token = await signAdminSession(
    { email: user.email, uid: user._id.toString() },
    secret,
  );
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: adminCookieSecure(),
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
