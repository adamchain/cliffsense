/**
 * Authorizes scheduled-job endpoints. Accepts a Vercel Cron request (which sets
 * `x-vercel-cron`) or an explicit bearer/secret matching `CRON_SECRET`. When no
 * `CRON_SECRET` is configured the endpoints are disabled (fail closed) outside
 * of Vercel Cron.
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  if (req.headers.get("x-vercel-cron")) {
    return true;
  }
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth === `Bearer ${secret}`) {
    return true;
  }
  const headerSecret = req.headers.get("x-cron-secret")?.trim();
  if (headerSecret && headerSecret === secret) {
    return true;
  }
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) {
      return true;
    }
  } catch {
    // ignore malformed URL
  }
  return false;
}
