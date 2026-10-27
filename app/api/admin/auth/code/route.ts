import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { prepareStaffAccount } from "@/lib/admin/staff-account";
import { issueAdminLoginCode } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";

const TTL_MS = 10 * 60 * 1000;
const schema = z.object({ email: z.string().email() });

/** Email a 6-digit code for the admin console. Main-app accounts are not enough. */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "admin-login-code", 5, 15 * 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const prepared = await prepareStaffAccount(parsed.data.email);
  if (!prepared.ok) {
    const error =
      prepared.reason === "disabled"
        ? "This admin account is disabled."
        : "Admin sign-in uses a @bene-watch.com email address.";
    return NextResponse.json({ error }, { status: prepared.reason === "disabled" ? 403 : 400 });
  }

  try {
    const code = await issueAdminLoginCode(prepared.user._id, TTL_MS);
    const { html, text } = renderEmail({
      heading: "Your admin sign-in code",
      preheader: `${code} is your Bene-Watch admin code.`,
      paragraphs: ["Enter this code on the admin sign-in page. It does not sign you into the main app."],
      code,
      bodyText: "This code expires in 10 minutes. If you didn't request it, you can ignore this email.",
      bodyHtml: `<p style="margin:0;font-size:13px;line-height:1.6;color:#566175;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`,
    });
    const sent = await sendEmail({
      to: prepared.user.email,
      subject: `Your Bene-Watch admin code: ${code}`,
      html,
      text,
    });
    if (!sent.ok) {
      console.warn("admin login-code email failed", sent.error);
      return NextResponse.json(
        { error: "Could not send the code. Please try again in a moment." },
        { status: 502 },
      );
    }
  } catch (e) {
    console.warn("admin login-code email failed", e);
    return NextResponse.json(
      { error: "Could not send the code. Please try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
