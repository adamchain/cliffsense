import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { issueLoginCode } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";
import Application from "@/lib/db/models/Application";
import { initialApplicationStatus, isReviewedRole, newStatusToken } from "@/lib/applications/review";
import { sendApplicationReceivedEmail } from "@/lib/applications/emails";

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;

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
    const applicationStatus = initialApplicationStatus(accountType);
    const user = await User.create({
      email: email.toLowerCase(),
      hashedPassword,
      name: name.trim(),
      accountType,
      onboardingStep,
      applicationStatus,
    });
    await logActivity({
      userId: user._id,
      category: "auth",
      action: "account.created",
      details: { accountType },
    });

    // Applicants acting for someone else need admin review. Open an Application
    // with a persistent status token and let them know it was received.
    if (isReviewedRole(accountType)) {
      const statusToken = newStatusToken();
      await Application.create({
        userId: user._id,
        accountType,
        status: "pending_review",
        statusToken,
        timeline: [{ type: "submitted", at: new Date(), note: "Application started." }],
      });
      try {
        await sendApplicationReceivedEmail({ to: user.email, statusToken });
      } catch (e) {
        console.warn("application received email failed", e);
      }
    }

    // Email a 6-digit code; entering it on the sign-up screen confirms the
    // address and signs the new account in. Does not block account creation.
    try {
      const code = await issueLoginCode(user._id, LOGIN_CODE_TTL_MS);
      const { html, text } = renderEmail({
        heading: "Your sign-in code",
        preheader: `${code} is your MyBenefitsPA sign-in code.`,
        paragraphs: [
          "Welcome to MyBenefitsPA. Enter this code on the sign-up screen to confirm your email and finish creating your account.",
        ],
        code,
        bodyText:
          "This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.",
        bodyHtml: `<p style="margin:0;font-size:13px;line-height:1.6;color:#566175;">This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>`,
      });
      await sendEmail({ to: user.email, subject: `Your MyBenefitsPA sign-in code: ${code}`, html, text });
    } catch (e) {
      console.warn("registration code email failed", e);
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
