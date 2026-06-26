/**
 * Branded HTML email layout. Produces email-client-safe markup (table layout,
 * inline styles, 600px max width) plus a matching plain-text version so every
 * message degrades gracefully. Colors mirror the app's brand tokens in
 * globals.css. `renderEmail` is the single place email chrome lives — callers
 * supply content, not markup.
 */
import { appUrl } from "@/lib/email/mailer";

export const BRAND = {
  name: "MyBenefitsPA",
  blue: "#1b6cc4",
  blueHover: "#15579e",
  navy: "#0f2a4c",
  green: "#67b13e",
  orange: "#db8a1e",
  danger: "#a4262c",
  text: "#16243a",
  textSecondary: "#566175",
  textMuted: "#97a0ad",
  surface: "#f4f6fa",
  card: "#ffffff",
  border: "#e3e8ef",
} as const;

const DISCLAIMER =
  "Informational only — MyBenefitsPA does not determine eligibility. Confirm with SSA, your county assistance office, or a qualified benefits counselor.";

export type EmailTone = "info" | "success" | "warning" | "danger";

export type RenderEmailOptions = {
  /** Bold headline at the top of the card. */
  heading: string;
  /** Short preview line shown by inboxes before the body is opened. */
  preheader?: string;
  /** Body paragraphs (plain strings; rendered as <p> in HTML). */
  paragraphs?: string[];
  /** Optional call-to-action button. */
  cta?: { label: string; url: string };
  /** Large monospace code block (e.g. a one-time sign-in code). */
  code?: string;
  /** Raw inner HTML for richer bodies (e.g. digest groups). Rendered after paragraphs. */
  bodyHtml?: string;
  /** Plain-text body used when `bodyHtml` is supplied (keeps text/html in sync). */
  bodyText?: string;
  /** Accent color for the heading rule; defaults to brand blue. */
  tone?: EmailTone;
};

function toneColor(tone: EmailTone | undefined): string {
  switch (tone) {
    case "success":
      return BRAND.green;
    case "warning":
      return BRAND.orange;
    case "danger":
      return BRAND.danger;
    default:
      return BRAND.blue;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds the branded HTML + plain-text pair for one email. */
export function renderEmail(opts: RenderEmailOptions): { html: string; text: string } {
  const accent = toneColor(opts.tone);
  const base = appUrl();
  const logoUrl = `${base}/mybenefitspa-logo.png`;
  const paragraphs = opts.paragraphs ?? [];

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${escapeHtml(
          p,
        )}</p>`,
    )
    .join("");

  const codeHtml = opts.code
    ? `<div style="margin:8px 0 20px;text-align:center;">
         <div style="display:inline-block;padding:14px 28px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:10px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:${BRAND.navy};">${escapeHtml(
           opts.code,
         )}</div>
       </div>`
    : "";

  const ctaHtml = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
         <tr><td style="border-radius:8px;background:${BRAND.blue};">
           <a href="${escapeHtml(opts.cta.url)}" target="_blank"
              style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(
                opts.cta.label,
              )}</a>
         </td></tr>
       </table>`
    : "";

  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
        opts.preheader,
      )}</div>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
      <!-- header -->
      <tr><td style="padding:8px 4px 16px;">
        <img src="${logoUrl}" alt="${BRAND.name}" height="30" style="height:30px;display:block;border:0;outline:none;" />
      </td></tr>
      <!-- card -->
      <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
        <div style="height:4px;background:${accent};"></div>
        <div style="padding:32px 36px;">
          <h1 style="margin:0 0 18px;font-size:21px;line-height:1.3;font-weight:700;color:${BRAND.navy};">${escapeHtml(
            opts.heading,
          )}</h1>
          ${paragraphsHtml}
          ${codeHtml}
          ${ctaHtml}
          ${opts.bodyHtml ?? ""}
        </div>
      </td></tr>
      <!-- footer -->
      <tr><td style="padding:22px 36px 8px;">
        <p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">${escapeHtml(
          DISCLAIMER,
        )}</p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">
          <a href="${base}" target="_blank" style="color:${BRAND.blue};text-decoration:none;">${BRAND.name}</a>
          &nbsp;·&nbsp; You're receiving this because you have a MyBenefitsPA account.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  // Plain-text mirror.
  const textParts: string[] = [opts.heading, ""];
  if (paragraphs.length) textParts.push(paragraphs.join("\n\n"), "");
  if (opts.code) textParts.push(`Your code: ${opts.code}`, "");
  if (opts.bodyText) textParts.push(opts.bodyText, "");
  if (opts.cta) textParts.push(`${opts.cta.label}: ${opts.cta.url}`, "");
  textParts.push(`— ${BRAND.name}`, DISCLAIMER);
  const text = textParts.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return { html, text };
}
