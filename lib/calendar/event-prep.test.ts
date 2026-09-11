import { describe, expect, it } from "vitest";
import { buildEventPrepPackage } from "./event-prep";
import { playbookIdForDeadlineKind } from "./deadline-kinds";

describe("event prep", () => {
  it("uses continued-benefits copy for appeal clocks", () => {
    const pack = buildEventPrepPackage({
      title: "Appeal deadline",
      kind: "appeal",
      program: "SSI",
    });
    expect(pack.headline).toMatch(/appeal/i);
    expect(pack.summary).toMatch(/continued-benefits/i);
  });
});

describe("deadline kind playbooks", () => {
  it("maps interview and verification clocks to the matching action plans", () => {
    expect(playbookIdForDeadlineKind("interview")).toBe("snap_interview");
    expect(playbookIdForDeadlineKind("verification")).toBe("verification_request");
    expect(playbookIdForDeadlineKind("premium")).toBe("mawd_transition");
  });
});
