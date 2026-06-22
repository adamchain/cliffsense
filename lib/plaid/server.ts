import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

export function isPlaidLinkConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function isPlaidExchangeConfigured(): boolean {
  return isPlaidLinkConfigured() && Boolean(process.env.PLAID_ENCRYPTION_KEY);
}

export function isPlaidConfigured(): boolean {
  return isPlaidExchangeConfigured();
}

/** Plaid OAuth redirect URI — required by some institutions in production. */
export function getPlaidRedirectUri(): string | undefined {
  const v = process.env.PLAID_REDIRECT_URI;
  return v && v.trim() ? v.trim() : undefined;
}

/** Plaid webhook URL (set in env or fall back to NEXTAUTH_URL + /api/plaid/webhook). */
export function getPlaidWebhookUrl(): string | undefined {
  const v = process.env.PLAID_WEBHOOK_URL;
  if (v && v.trim()) return v.trim();
  const base = process.env.NEXTAUTH_URL?.trim();
  if (base && /^https:\/\//i.test(base)) {
    return `${base.replace(/\/+$/, "")}/api/plaid/webhook`;
  }
  return undefined;
}

export function getPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
  }
  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  const config = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });
  return new PlaidApi(config);
}

/**
 * Minimal Link product set for MyBenefitsPA. (Recurring is requested separately via Plaid
 * recurring APIs where supported — it is not valid in optional_products for many teams.)
 */
export function linkTokenCreateConfig(): { products: Products[] } {
  return { products: [Products.Transactions] };
}

/** Read link_token from Plaid axios responses (body may live on `.data` or be the object itself). */
export function extractLinkTokenCreateResult(
  resp: unknown,
): { link_token?: string; expiration?: string } {
  if (resp == null || typeof resp !== "object") {
    return {};
  }
  const r = resp as { data?: unknown };
  let body: unknown = r.data !== undefined ? r.data : resp;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return {};
    }
  }
  if (body == null || typeof body !== "object") {
    return {};
  }
  const b = body as Record<string, unknown>;
  const link_token =
    (typeof b.link_token === "string" && b.link_token) ||
    (typeof b.linkToken === "string" && b.linkToken) ||
    undefined;
  const expiration = typeof b.expiration === "string" ? b.expiration : undefined;
  return { link_token, expiration };
}

export function formatPlaidAxiosError(err: unknown): string | undefined {
  const e = err as { response?: { data?: { error_message?: string; error_code?: string } }; message?: string };
  const d = e.response?.data;
  if (d) {
    if (typeof d.error_message === "string" && d.error_message) {
      return d.error_message;
    }
    if (typeof d.error_code === "string" && d.error_code) {
      return d.error_code;
    }
  }
  if (typeof e.message === "string" && e.message) {
    return e.message;
  }
  return undefined;
}

export const linkCountryCodes = [CountryCode.Us];
