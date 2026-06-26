import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { issueAuthToken } from "@/lib/auth/tokens";
import { appUrl, sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";

const RESET_TTL_MS = 60 * 60 * 1000;
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "forgot", 5, 15 * 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  // Always respond the same way to avoid leaking which emails are registered.
  const generic = NextResponse.json({ ok: true });
  if (!parsed.success) {
    return generic;
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase().trim() })
    .select("_id email")
    .lean();
  if (!user) {
    return generic;
  }

  try {
    const token = await issueAuthToken(user._id, "password_reset", RESET_TTL_MS);
    const link = `${appUrl()}/auth/reset?token=${encodeURIComponent(token)}`;
    const { html, text } = renderEmail({
      heading: "Reset your password",
      preheader: "Set a new MyBenefitsPA password.",
      paragraphs: [
        "We received a request to reset the password on your MyBenefitsPA account. Click below to choose a new one.",
        "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.",
      ],
      cta: { label: "Reset password", url: link },
    });
    await sendEmail({ to: user.email, subject: "Reset your MyBenefitsPA password", html, text });
  } catch (e) {
    console.warn("forgot-password email failed", e);
  }

  return generic;
}
