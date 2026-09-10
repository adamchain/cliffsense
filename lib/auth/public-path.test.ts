import { describe, expect, it } from "vitest";
import { appPathAfterLogin, isPublicPath } from "./public-path";

describe("isPublicPath", () => {
  it("treats only the exact homepage as public, not the rest of the app", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/onboarding/profile")).toBe(false);
    expect(isPublicPath("/application")).toBe(false);
  });

  it("does not treat /application as /apply", () => {
    expect(isPublicPath("/apply")).toBe(true);
    expect(isPublicPath("/apply/foo")).toBe(true);
    expect(isPublicPath("/application")).toBe(false);
  });

  it("allows auth and legal trees", () => {
    expect(isPublicPath("/auth/signin")).toBe(true);
    expect(isPublicPath("/legal/privacy")).toBe(true);
  });
});

describe("appPathAfterLogin", () => {
  it("replaces the waitlist homepage with the app", () => {
    expect(appPathAfterLogin("/")).toBe("/dashboard");
    expect(appPathAfterLogin(null)).toBe("/dashboard");
    expect(appPathAfterLogin("/thresholds")).toBe("/thresholds");
  });
});
