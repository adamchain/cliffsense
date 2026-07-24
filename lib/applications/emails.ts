import { appUrl, sendEmail } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/template";

/* ----------------------------------------------------------------------------
 * Transactional emails for the reviewed-application flow. Every message links to
 * the applicant's persistent status page so they can "check status any time".
 * Best-effort: sending never throws (sendEmail returns a result).
 * ------------------------------------------------------------------------- */

/** The public status link the applicant can revisit any time. */
export function statusUrl(statusToken: string): string {
  return `${appUrl()}/status/${statusToken}`;
}

type Recipient = { to: string; statusToken: string };

export async function sendApplicationReceivedEmail({ to, statusToken }: Recipient): Promise<void> {
  const url = statusUrl(statusToken);
  const { html, text } = renderEmail({
    heading: "We received your application",
    preheader: "Your MyBenefitsPA application is under review.",
    tone: "info",
    paragraphs: [
      "Thanks for applying to MyBenefitsPA. Because you're signing up to help manage benefits for someone else, our team reviews each application before granting access.",
      "Next step: sign in and upload one authorization document — a Representative Payee letter (SSA) or a Power of Attorney for financial affairs. We'll review it and email you when a decision is made.",
      "You can check your status any time using the link below — bookmark it.",
    ],
    cta: { label: "Check application status", url },
  });
  await sendEmail({ to, subject: "Your MyBenefitsPA application", html, text });
}

export async function sendDocumentReceivedEmail({ to, statusToken }: Recipient): Promise<void> {
  const url = statusUrl(statusToken);
  const { html, text } = renderEmail({
    heading: "Document received",
    preheader: "We received your authorization document.",
    tone: "info",
    paragraphs: [
      "We received your authorization document and it's now in the review queue. We'll email you as soon as our team makes a decision — usually within a few business days.",
    ],
    cta: { label: "Check application status", url },
  });
  await sendEmail({ to, subject: "MyBenefitsPA — document received", html, text });
}

export async function sendApplicationApprovedEmail({ to, statusToken }: Recipient): Promise<void> {
  const url = statusUrl(statusToken);
  const { html, text } = renderEmail({
    heading: "You're approved",
    preheader: "Your MyBenefitsPA application was approved.",
    tone: "success",
    paragraphs: [
      "Good news — your application was approved. You now have full access to MyBenefitsPA.",
      "Sign in to finish setting up: add the person you're helping, link accounts (read-only — money never moves), and choose the benefit programs to track.",
    ],
    cta: { label: "Sign in and continue", url: `${appUrl()}/auth/signin` },
    bodyText: `You can also review your application status here: ${url}`,
  });
  await sendEmail({ to, subject: "Your MyBenefitsPA application was approved", html, text });
}

export async function sendApplicationRejectedEmail({
  to,
  statusToken,
  reason,
}: Recipient & { reason?: string }): Promise<void> {
  const url = statusUrl(statusToken);
  const paragraphs = [
    "After reviewing your application, we're unable to approve it at this time.",
  ];
  if (reason && reason.trim()) paragraphs.push(`Reason: ${reason.trim()}`);
  paragraphs.push(
    "If you believe this is a mistake or you have a different authorization document, reply to this email or upload it from your status page and we'll take another look.",
  );
  const { html, text } = renderEmail({
    heading: "Update on your application",
    preheader: "A decision has been made on your MyBenefitsPA application.",
    tone: "danger",
    paragraphs,
    cta: { label: "View status", url },
  });
  await sendEmail({ to, subject: "Update on your MyBenefitsPA application", html, text });
}

export async function sendApplicationInfoRequestedEmail({
  to,
  statusToken,
  note,
}: Recipient & { note?: string }): Promise<void> {
  const url = statusUrl(statusToken);
  const paragraphs = ["Our team needs a bit more information before we can finish reviewing your application."];
  if (note && note.trim()) paragraphs.push(`What we need: ${note.trim()}`);
  paragraphs.push("Please sign in and upload the requested document or reply to this email.");
  const { html, text } = renderEmail({
    heading: "We need a little more information",
    preheader: "Action needed on your MyBenefitsPA application.",
    tone: "warning",
    paragraphs,
    cta: { label: "Check application status", url },
  });
  await sendEmail({ to, subject: "MyBenefitsPA — more information needed", html, text });
}
