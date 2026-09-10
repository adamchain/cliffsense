/**
 * Marketing / unauthenticated pages. `/` is exact-only so `/dashboard` is not
 * treated as public just because it starts with a slash.
 */
const PUBLIC_PREFIXES = [
  "/about",
  "/auth",
  "/resources",
  "/legal",
  "/invite",
  "/status",
  "/apply",
] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** After sign-in, never land on the public waitlist homepage. */
export function appPathAfterLogin(callbackUrl: string | null | undefined, fallback = "/dashboard"): string {
  const raw = (callbackUrl ?? "").trim() || fallback;
  if (raw === "/" || raw === "") return fallback;
  return raw;
}
