import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimits());

  it("allows up to the limit then blocks", () => {
    const t0 = 1_000_000;
    expect(rateLimit("k", 3, 1000, t0).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, t0).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, t0).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const t0 = 2_000_000;
    rateLimit("k", 1, 1000, t0);
    expect(rateLimit("k", 1, 1000, t0).ok).toBe(false);
    expect(rateLimit("k", 1, 1000, t0 + 1001).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const t0 = 3_000_000;
    rateLimit("a", 1, 1000, t0);
    expect(rateLimit("a", 1, 1000, t0).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, t0).ok).toBe(true);
  });
});
