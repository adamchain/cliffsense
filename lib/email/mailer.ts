/**
 * Single email entry point. Uses Mailgun when `MAILGUN_API_KEY` is set; otherwise
 * logs to the console so local/dev flows (verification, login codes, invites,
 * digests, alerts) are observable without a provider. Never throws — returns a
 * result the caller can branch on.
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  cc?: string | string[];
};

export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string };

export function appUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function mailgunDomain(): string {
  return (
    process.env.MAILGUN_DOMAIN?.trim() ||
    "sandbox7c06cd4cda984f4c954b86fdd23c0dca.mailgun.org"
  );
}

export function defaultFrom(): string {
  const explicit = process.env.MAILGUN_FROM_EMAIL?.trim();
  if (explicit) return explicit;
  // Sandbox domains require the postmaster@ sender; production should set MAILGUN_FROM_EMAIL.
  return `MyBenefitsPA <postmaster@${mailgunDomain()}>`;
}

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((v) => v.trim()).filter(Boolean);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = toList(input.to);
  const cc = toList(input.cc);
  if (to.length === 0) {
    return { ok: false, error: "missing recipient" };
  }

  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  if (!apiKey) {
    // Dev fallback: make the message observable without a provider.
    console.info(
      `\n[email:dev] to=${to.join(", ")}${cc.length ? `\n[email:dev] cc=${cc.join(", ")}` : ""}\n[email:dev] subject=${input.subject}\n[email:dev] ${input.text}\n`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const { default: Mailgun } = await import("mailgun.js");
    const { default: FormData } = await import("form-data");
    const mailgun = new Mailgun(FormData as never);
    const mg = mailgun.client({
      username: "api",
      key: apiKey,
      url: process.env.MAILGUN_BASE_URL?.trim() || "https://api.mailgun.net",
    });

    await mg.messages.create(mailgunDomain(), {
      from: defaultFrom(),
      to,
      ...(cc.length ? { cc } : {}),
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    return { ok: true };
  } catch (e) {
    console.warn("sendEmail mailgun error", e);
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "send failed";
    return { ok: false, error: message };
  }
}

const DISCLAIMER = "Informational only — MyBenefitsPA does not determine eligibility. Confirm with SSA, your county assistance office, or a qualified benefits counselor.";

export function withDisclaimer(body: string): string {
  return `${body}\n\n— MyBenefitsPA\n${DISCLAIMER}`;
}
