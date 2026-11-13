import { describe, expect, it } from "vitest";
import { exclusionRuleMatches } from "@/lib/transactions/exclusion-rule";

describe("recurring benefit exclusion", () => {
  const rule = {
    active: true,
    matcher: {
      merchantName: "social security administration",
      amountMinCents: -663_00,
      amountMaxCents: -663_00,
    },
    action: { excludeFromThresholds: true, userCategory: "benefit_deposit" },
  };

  it("matches the same Social Security amount and leaves the other amount alone", () => {
    expect(
      exclusionRuleMatches(rule, {
        merchantName: "Social Security Administration",
        amountCents: -663_00,
      }),
    ).toBe(true);
    expect(
      exclusionRuleMatches(rule, {
        merchantName: "Social Security Administration",
        amountCents: -1140_00,
      }),
    ).toBe(false);
  });
});
