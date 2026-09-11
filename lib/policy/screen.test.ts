import { describe, expect, it } from "vitest";
import { POLICY_RULES, ruleGate } from "./rules";
import {
  EMPTY_POLICY_ANSWERS,
  evaluateImmigrantStatus,
  evaluateMagiWork,
  evaluateSnapWork,
} from "./screen";

const NOW = new Date("2026-09-11T12:00:00.000Z");

describe("policy rule gates", () => {
  it("keeps deck rules unverified even after the proposed date", () => {
    expect(POLICY_RULES.snap_work_expansion.verified).toBe(false);
    expect(ruleGate(POLICY_RULES.snap_work_expansion, NOW)).toBe("unverified");
    expect(ruleGate(POLICY_RULES.immigrant_restrictions_2026, NOW)).toBe("unverified");
    expect(ruleGate(POLICY_RULES.magi_work_80h, NOW)).toBe("unverified");
  });

  it("only uses the proposed date after the rule is verified", () => {
    const verified = { ...POLICY_RULES.magi_work_80h, verified: true };
    expect(ruleGate(verified, new Date("2026-12-01T00:00:00.000Z"))).toBe("scheduled");
    expect(ruleGate(verified, new Date("2027-01-01T00:00:00.000Z"))).toBe("in_effect");
  });
});

describe("SNAP work screen", () => {
  it("does not treat veteran or foster status as enough, and flags a 15-year-old child", () => {
    const veteran = evaluateSnapWork({ ...EMPTY_POLICY_ANSWERS, age: 35, veteran: true }, NOW);
    expect(veteran.gate).toBe("unverified");
    expect(veteran.flags.some((f) => f.id === "veteran" && f.status === "removed")).toBe(true);

    const foster = evaluateSnapWork(
      { ...EMPTY_POLICY_ANSWERS, age: 23, formerFosterYouth: true },
      NOW,
    );
    expect(foster.flags.some((f) => f.id === "foster" && f.status === "removed")).toBe(true);

    const carlos = evaluateSnapWork({ ...EMPTY_POLICY_ANSWERS, age: 40, youngestChildAge: 15 }, NOW);
    expect(carlos.flags.some((f) => f.id === "child_14_plus")).toBe(true);
    expect(carlos.headline).toMatch(/activity or another exemption/i);
  });

  it("treats a child under 14 as a possible remaining exemption", () => {
    const r = evaluateSnapWork({ ...EMPTY_POLICY_ANSWERS, age: 32, youngestChildAge: 8 }, NOW);
    expect(r.flags.some((f) => f.status === "possible" && f.id === "child_under_14")).toBe(true);
    expect(r.headline).toMatch(/remaining exemption/i);
  });

  it("puts a 60-year-old in the expanded SNAP work band until the cutoff is verified", () => {
    const walter = evaluateSnapWork({ ...EMPTY_POLICY_ANSWERS, age: 60 }, NOW);
    expect(walter.gate).toBe("unverified");
    expect(walter.headline).toMatch(/documented activity/i);
  });
});

describe("MAGI and immigrant screens", () => {
  it("does not treat 80 hours as a current MAGI requirement", () => {
    const r = evaluateMagiWork({ ...EMPTY_POLICY_ANSWERS, age: 30, magiHours: 90 }, NOW);
    expect(r.gate).toBe("unverified");
    expect(r.headline).toMatch(/payroll proof/i);
  });

  it("flags lawfully present status as high misclassification risk", () => {
    const r = evaluateImmigrantStatus(
      { ...EMPTY_POLICY_ANSWERS, immigrationCategory: "lpr", receivedImmigrantNotice: true },
      NOW,
    );
    expect(r.playbookId).toBe("immigrant_restrictions_2026");
    expect(r.headline).toMatch(/misclassified/i);
    expect(r.flags.some((f) => f.id === "notice")).toBe(true);
  });
});
