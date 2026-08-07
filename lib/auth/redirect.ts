/**
 * Resolve a post-login destination to a path on the CURRENT origin. NextAuth
 * builds `res.url` from NEXTAUTH_URL; if that env is stale it would otherwise
 * redirect users off-site. Keep only the path so the redirect always lands on
 * the host the user is actually on.
 */
export function sameOriginDest(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
