import { NextResponse } from "next/server";

/**
 * Best-effort fixed-window rate limiter held in process memory. In a serverless
 * deployment each instance keeps its own counters, so this throttles abuse
 * without claiming to be a global limiter — pair with a WAF/edge limit for hard
 * guarantees. Pure and `now`-injectable for testing.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** Resets all counters. Test helper. */
export function __resetRateLimits(): void {
  store.clear();
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]!.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Enforces a limit for `name` scoped to the caller's IP. Returns a 429 response
 * when exceeded, or null to proceed.
 */
export function enforceRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(`${name}:${ip}`, limit, windowMs);
  if (result.ok) {
    return null;
  }
  const retryAfter = Math.ceil(result.retryAfterMs / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
