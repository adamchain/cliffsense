import { describe, expect, it } from "vitest";
import { composeDigestText, type DigestGroup } from "./digest";

const groups: DigestGroup[] = [
  {
    beneficiaryName: "Graham R.",
    alerts: [
      { level: "warning", message: "Earned income approaching SGA.", createdAt: new Date() },
      { level: "breach", message: "Asset balance may exceed SSI limit.", createdAt: new Date() },
    ],
  },
];

describe("composeDigestText", () => {
  it("summarizes the alert count for the window", () => {
    const text = composeDigestText(groups, "daily");
    expect(text).toContain("2 new benefit-threshold alerts today");
    expect(text).toContain("Graham R.:");
  });

  it("orders breaches before warnings within a beneficiary", () => {
    const text = composeDigestText(groups, "weekly");
    const reviewIdx = text.indexOf("[Review]");
    const watchIdx = text.indexOf("[Watch]");
    expect(reviewIdx).toBeGreaterThanOrEqual(0);
    expect(watchIdx).toBeGreaterThan(reviewIdx);
    expect(text).toContain("this week");
  });

  it("always includes the informational disclaimer", () => {
    const text = composeDigestText(groups, "daily");
    expect(text).toContain("does not determine eligibility");
  });
});
