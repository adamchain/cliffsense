import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { issueAuthToken } from "@/lib/auth/tokens";
import { appUrl, sendEmail, withDisclaimer } from "@/lib/email/mailer";

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
    await sendEmail({
      to: user.email,
      subject: "Reset your CliffSense password",
      text: withDisclaimer(
        `We received a request to reset your password. Set a new one here:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
      ),
    });
  } catch (e) {
    console.warn("forgot-password email failed", e);
  }

  return generic;
}
