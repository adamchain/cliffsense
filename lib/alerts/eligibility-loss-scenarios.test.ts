import { describe, it, expect } from "vitest";
import { ELIGIBILITY_LOSS_SCENARIOS } from "@/lib/alerts/eligibility-loss-scenarios";
import { SALARY_SNT_SCENARIOS } from "@/lib/benefits/salary-snt-scenarios";

describe("eligibility-loss scenarios", () => {
  it("catalogs 30 scenarios", () => {
    expect(ELIGIBILITY_LOSS_SCENARIOS).toHaveLength(30);
  });

  it("has unique ids", () => {
    const ids = ELIGIBILITY_LOSS_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks a subset as auto-detectable", () => {
    const auto = ELIGIBILITY_LOSS_SCENARIOS.filter((s) => s.autoDetect);
    expect(auto.length).toBeGreaterThanOrEqual(10);
    expect(auto.every((s) => s.risk && s.action)).toBe(true);
  });

  it("covers cliff, reporting, snt, and able triggers", () => {
    const triggers = new Set(ELIGIBILITY_LOSS_SCENARIOS.map((s) => s.trigger));
    expect(triggers.has("cliff")).toBe(true);
    expect(triggers.has("reporting")).toBe(true);
    expect(triggers.has("snt")).toBe(true);
    expect(triggers.has("able")).toBe(true);
  });
});

describe("salary × SNT reporting scenarios", () => {
  it("defines five scenarios with reporting steps", () => {
    expect(SALARY_SNT_SCENARIOS).toHaveLength(5);
    for (const s of SALARY_SNT_SCENARIOS) {
      expect(s.reportingSteps.length).toBeGreaterThanOrEqual(2);
      expect(s.ssiImpact.length).toBeGreaterThan(20);
      expect(s.ssdiImpact.length).toBeGreaterThan(20);
      expect(s.vaultTips.length).toBeGreaterThan(0);
    }
  });

  it("includes cash, shelter, food, and SGA-past cases", () => {
    const ids = SALARY_SNT_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual([
      "salary_only",
      "salary_plus_snt_cash",
      "salary_plus_snt_shelter",
      "salary_plus_snt_food",
      "salary_past_sga_snt_shelter",
    ]);
  });
});
