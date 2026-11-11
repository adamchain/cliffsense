import { describe, expect, it } from "vitest";
import { onboardingPathForStep, stepRequiresBetaAgreement } from "@/lib/onboarding/steps";

describe("fast onboarding paths", () => {
  it("sends new and unfinished accounts to the agreement", () => {
    expect(onboardingPathForStep("none")).toBe("/onboarding/agreement");
    expect(onboardingPathForStep("role")).toBe("/onboarding/agreement");
    expect(onboardingPathForStep("agreement")).toBe("/onboarding/agreement");
    expect(onboardingPathForStep("profile")).toBe("/onboarding/agreement");
    expect(onboardingPathForStep("authority")).toBe("/onboarding/agreement");
  });

  it("skips the bank step", () => {
    expect(onboardingPathForStep("benefits")).toBe("/onboarding/setup");
    expect(onboardingPathForStep("setup")).toBe("/onboarding/setup");
    expect(onboardingPathForStep("plaid")).toBe("/onboarding/notifications");
    expect(onboardingPathForStep("notifications")).toBe("/onboarding/notifications");
  });

  it("requires the beta agreement before any step after it", () => {
    expect(stepRequiresBetaAgreement("agreement")).toBe(false);
    expect(stepRequiresBetaAgreement("role")).toBe(false);
    expect(stepRequiresBetaAgreement("setup")).toBe(true);
    expect(stepRequiresBetaAgreement("notifications")).toBe(true);
    expect(stepRequiresBetaAgreement("complete")).toBe(true);
    expect(stepRequiresBetaAgreement("plaid")).toBe(true);
  });
});
