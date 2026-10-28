import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Application from "@/lib/db/models/Application";
import { initialApplicationStatus, isReviewedRole, newStatusToken } from "@/lib/applications/review";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";
import { issueLoginCode } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  accountType: z.enum(["beneficiary", "family", "fiduciary", "nonprofit"]),
  // Optional. If omitted, a random password is set and the user signs in with
  // the emailed code and sets their own password later.
  password: z.string().min(8).max(200).optional(),
  // Skip the onboarding flow and open the application gate — the admin vouches
  // for this account, so it lands fully approved and complete.
  completeOnboarding: z.boolean().optional(),
  // Email the new user a sign-in code so they can access the account.
  sendCode: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, name, accountType, password, completeOnboarding, sendCode } = parsed.data;
  const address = email.toLowerCase().trim();

  await connectDB();
  const existing = await User.findOne({ email: address }).select("_id").lean();
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  // A password is required on the model; generate a strong random one when the
  // admin leaves it blank so the account exists and can be reached by code.
  const plainPassword = password ?? crypto.randomBytes(24).toString("base64url");
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const onboardingStep = completeOnboarding ? "complete" : "role";
  const applicationStatus = completeOnboarding
    ? "approved"
    : initialApplicationStatus(accountType);

  const user = await User.create({
    email: address,
    hashedPassword,
    name: name.trim(),
    accountType,
    onboardingStep,
    applicationStatus,
    // The admin has confirmed this address, so skip the self-serve email gate.
    emailVerified: new Date(),
  });

  await logActivity({
    userId: user._id,
    category: "auth",
    action: "account.created",
    details: { accountType, createdByAdmin: true },
  });

  // Reviewed roles still need an Application on file for the review trail, unless
  // the admin chose to approve and complete the account outright.
  if (isReviewedRole(accountType) && !completeOnboarding) {
    const statusToken = newStatusToken();
    await Application.create({
      userId: user._id,
      accountType,
      status: "pending_review",
      statusToken,
      timeline: [{ type: "submitted", at: new Date(), note: "Created by admin." }],
    });
  }

  let emailSent = false;
  if (sendCode !== false) {
    try {
      const code = await issueLoginCode(user._id, LOGIN_CODE_TTL_MS);
      const { html, text } = renderEmail({
        heading: "Your sign-in code",
        preheader: `${code} is your Bene-Watch sign-in code.`,
        paragraphs: [
          "An account has been created for you on Bene-Watch. Enter this code on the sign-in screen to access it.",
        ],
        code,
        bodyText:
          "This code expires in 10 minutes. If you weren't expecting this, you can safely ignore this email.",
        bodyHtml: `<p style="margin:0;font-size:13px;line-height:1.6;color:#566175;">This code expires in 10 minutes. If you weren't expecting this, you can safely ignore this email.</p>`,
      });
      const sent = await sendEmail({
        to: user.email,
        subject: `Your Bene-Watch sign-in code: ${code}`,
        html,
        text,
      });
      emailSent = sent.ok;
      if (!sent.ok) {
        console.warn("admin create-user code email failed", sent.error);
      }
    } catch (e) {
      console.warn("admin create-user code email failed", e);
    }
  }

  const meta = clientMeta(req);
  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "create_user",
    targetUserId: user._id.toString(),
    targetEmail: user.email,
    details: { accountType, completeOnboarding: !!completeOnboarding, emailSent },
    ...meta,
  });

  return NextResponse.json({
    ok: true,
    userId: user._id.toString(),
    email: user.email,
    emailSent,
    // Only returned when the admin did not set a password, so they can relay it.
    generatedPassword: password ? undefined : plainPassword,
  });
}
