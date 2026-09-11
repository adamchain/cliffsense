import { describe, it, expect } from "vitest";
import {
  CLOSURE_CODE_NOTES,
  ELIGIBILITY_LOSS_PERSONAS,
} from "@/lib/alerts/eligibility-loss-personas";
import { ELIGIBILITY_LOSS_SCENARIOS } from "@/lib/alerts/eligibility-loss-scenarios";
import { SALARY_SNT_SCENARIOS } from "@/lib/benefits/salary-snt-scenarios";

describe("eligibility-loss personas", () => {
  it("catalogs the 30 named prevention scenarios", () => {
    expect(ELIGIBILITY_LOSS_PERSONAS).toHaveLength(30);
    expect(ELIGIBILITY_LOSS_PERSONAS.map((s) => s.n)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
  });

  it("gives each persona six cure steps and unique ids", () => {
    const ids = ELIGIBILITY_LOSS_PERSONAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(30);
    for (const s of ELIGIBILITY_LOSS_PERSONAS) {
      expect(s.steps).toHaveLength(6);
      expect(s.programs.length).toBeGreaterThan(0);
    }
  });

  it("clarifies DHS closure codes 042, 440, and SNAP 474", () => {
    expect(CLOSURE_CODE_NOTES["042"]).toMatch(/Failure to Furnish/i);
    expect(CLOSURE_CODE_NOTES["440"]).toMatch(/Semi-Annual Reporting/i);
    expect(CLOSURE_CODE_NOTES["474"]).toMatch(/certification period/i);
    expect(CLOSURE_CODE_NOTES["474"]).toMatch(/does not by itself prove/i);
  });
});

describe("eligibility-loss scenarios", () => {
  it("catalogs 30 auto/reference cliff scenarios", () => {
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
