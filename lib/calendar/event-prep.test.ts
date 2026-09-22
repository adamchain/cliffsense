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
    expect(playbookIdForDeadlineKind("sar", "SNAP")).toBe("snap_sar_renewal");
    expect(playbookIdForDeadlineKind("renewal", "SNAP")).toBe("snap_sar_renewal");
    expect(playbookIdForDeadlineKind("sar", "MedicaidMAGI")).toBe("medicaid_renewal_packet");
    expect(playbookIdForDeadlineKind("verification")).toBe("verification_request");
    expect(playbookIdForDeadlineKind("premium")).toBe("mawd_transition");
    expect(playbookIdForDeadlineKind("appeal")).toBe("appeal_continued_benefits");
    expect(playbookIdForDeadlineKind("continued_benefits")).toBe("appeal_continued_benefits");
    expect(playbookIdForDeadlineKind("deadline", "SSI")).toBe("calendar_notice");
    expect(playbookIdForDeadlineKind("appointment", "SNAP")).toBe("calendar_notice");
  });
});
