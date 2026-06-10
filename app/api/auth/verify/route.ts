import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { appUrl } from "@/lib/email/mailer";
import { logActivity } from "@/lib/activity/log-activity";

/** Email verification link target. Consumes the token and marks the email verified. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const base = appUrl();
  if (!token) {
    return NextResponse.redirect(`${base}/auth/signin?verify=invalid`);
  }

  const userId = await consumeAuthToken(token, "email_verify");
  if (!userId) {
    return NextResponse.redirect(`${base}/auth/signin?verify=invalid`);
  }

  await connectDB();
  await User.updateOne(
    { _id: userId, emailVerified: null },
    { $set: { emailVerified: new Date() } },
  );
  await logActivity({
    userId,
    category: "auth",
    action: "email.verified",
  });

  return NextResponse.redirect(`${base}/auth/signin?verify=success`);
}
