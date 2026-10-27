import { describe, expect, it } from "vitest";
import { readAdminSession, signAdminSession } from "./session-token";

const SECRET = "test-admin-secret";

describe("admin session token", () => {
  it("round-trips a signed session", async () => {
    const token = await signAdminSession(
      { email: "ada@bene-watch.com", uid: "abc" },
      SECRET,
      1_700_000_000,
    );
    const claims = await readAdminSession(token, SECRET, 1_700_000_100);
    expect(claims?.email).toBe("ada@bene-watch.com");
    expect(claims?.uid).toBe("abc");
  });

  it("rejects a tampered token and a wrong secret", async () => {
    const token = await signAdminSession({ email: "ada@bene-watch.com", uid: "abc" }, SECRET, 1_700_000_000);
    const mid = Math.floor(token.length / 2);
    const flipped = `${token.slice(0, mid)}${token[mid] === "a" ? "b" : "a"}${token.slice(mid + 1)}`;
    expect(await readAdminSession(flipped, SECRET, 1_700_000_100)).toBeNull();
    expect(await readAdminSession(token, "other-secret", 1_700_000_100)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signAdminSession({ email: "ada@bene-watch.com", uid: "abc" }, SECRET, 1_700_000_000);
    expect(await readAdminSession(token, SECRET, 1_700_000_000 + 12 * 60 * 60)).toBeNull();
  });
});
