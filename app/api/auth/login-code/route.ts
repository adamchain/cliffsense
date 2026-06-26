import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { issueLoginCode } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";

/** Passwordless sign-in: email the user a 6-digit code valid for 10 minutes. */
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "login-code", 5, 15 * 60 * 1000);
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
    const code = await issueLoginCode(user._id, LOGIN_CODE_TTL_MS);
    const { html, text } = renderEmail({
      heading: "Your sign-in code",
      preheader: `${code} is your MyBenefitsPA sign-in code.`,
      paragraphs: ["Enter this code on the sign-in screen to continue."],
      code,
      bodyText: "This code expires in 10 minutes. If you didn't request it, you can ignore this email.",
      bodyHtml: `<p style="margin:0;font-size:13px;line-height:1.6;color:#566175;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`,
    });
    await sendEmail({ to: user.email, subject: `Your MyBenefitsPA sign-in code: ${code}`, html, text });
  } catch (e) {
    console.warn("login-code email failed", e);
  }

  return generic;
}
