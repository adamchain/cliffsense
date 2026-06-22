import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { issueAuthToken } from "@/lib/auth/tokens";
import { appUrl, sendEmail, withDisclaimer } from "@/lib/email/mailer";

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function isMongoBadAuth(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: number; message?: string };
  if (err.code === 8000) return true;
  return /bad auth|authentication failed/i.test(String(err.message ?? ""));
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  accountType: z.enum(["beneficiary", "family", "fiduciary", "nonprofit"]),
});

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "register", 5, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password, name, accountType } = parsed.data;
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const onboardingStep = accountType === "beneficiary" ? "profile" : "profile";
    const user = await User.create({
      email: email.toLowerCase(),
      hashedPassword,
      name: name.trim(),
      accountType,
      onboardingStep,
    });
    await logActivity({
      userId: user._id,
      category: "auth",
      action: "account.created",
      details: { accountType },
    });

    // Fire-and-forget email verification (does not block sign-in).
    try {
      const token = await issueAuthToken(user._id, "email_verify", EMAIL_VERIFY_TTL_MS);
      const link = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your MyBenefitsPA email",
        text: withDisclaimer(
          `Welcome to MyBenefitsPA. Confirm this email address to secure your account:\n${link}\n\nThis link expires in 24 hours.`,
        ),
      });
    } catch (e) {
      console.warn("verification email failed", e);
    }

    return NextResponse.json({ ok: true, userId: user._id.toString() });
  } catch (e) {
    console.error(e);
    if (isMongoBadAuth(e)) {
      return NextResponse.json(
        {
          error:
            "Database login failed. In MongoDB Atlas → Database Access, reset this user’s password and update MONGODB_URI in .env.local (URL-encode special characters in the password).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
