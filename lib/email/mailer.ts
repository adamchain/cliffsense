/**
 * Single email entry point. Uses Resend when `RESEND_API_KEY` is set; otherwise
 * logs to the console so local/dev flows (verification, invites, digests) are
 * observable without a provider. Never throws — returns a result the caller can
 * branch on.
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string };

export function appUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function defaultFrom(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "CliffSense <onboarding@resend.dev>";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to?.trim();
  if (!to) {
    return { ok: false, error: "missing recipient" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // Dev fallback: make the message observable without a provider.
    console.info(
      `\n[email:dev] to=${to}\n[email:dev] subject=${input.subject}\n[email:dev] ${input.text}\n`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: defaultFrom(),
      to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    if (error) {
      console.warn("sendEmail resend error", error);
      return { ok: false, error: String((error as { message?: string }).message ?? error) };
    }
    return { ok: true };
  } catch (e) {
    console.warn("sendEmail threw", e);
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

const DISCLAIMER = "Informational only — CliffSense does not determine eligibility. Confirm with SSA, your county assistance office, or a qualified benefits counselor.";

export function withDisclaimer(body: string): string {
  return `${body}\n\n— CliffSense\n${DISCLAIMER}`;
}
