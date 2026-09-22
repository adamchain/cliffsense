import { describe, expect, it } from "vitest";
import {
  enrolledWorkersWithJobSuccess,
  mawdIncomeAlert,
  mawdIncomeLimitCents,
  mawdJobSuccessIncomeLimitCents,
  mawdResourceAlert,
} from "@/lib/benefits/mawd-limits";

describe("MAWD limits", () => {
  it("uses the 2026 household tables", () => {
    expect(mawdIncomeLimitCents(1)).toBe(3325_00);
    expect(mawdIncomeLimitCents(2)).toBe(4509_00);
    expect(mawdIncomeLimitCents(3)).toBe(5692_00);
    expect(mawdIncomeLimitCents(9)).toBe(11609_00 + 1184_00);
    expect(mawdJobSuccessIncomeLimitCents(1)).toBe(7980_00);
    expect(mawdJobSuccessIncomeLimitCents(2)).toBe(10820_00);
  });

  it("is Important when countable income reaches the limit", () => {
    expect(mawdIncomeAlert(3325_00, 3325_00)).toBe("breach");
    expect(mawdIncomeAlert(3324_00, 3325_00)).toBe("warning");
    expect(mawdIncomeAlert(2000_00, 3325_00)).toBeNull();
  });

  it("is Important only when resources are over $10,000", () => {
    expect(mawdResourceAlert(10000_00)).toBe("warning");
    expect(mawdResourceAlert(10000_01)).toBe("breach");
    expect(mawdResourceAlert(8500_00)).toBeNull();
  });

  it("reads Workers with Job Success only from a MAWD enrollment", () => {
    expect(enrolledWorkersWithJobSuccess([{ program: "MAWD", contextData: { workersWithJobSuccess: true } }])).toBe(
      true,
    );
    expect(enrolledWorkersWithJobSuccess([{ program: "MedicaidABD", contextData: { workersWithJobSuccess: true } }])).toBe(
      false,
    );
    expect(enrolledWorkersWithJobSuccess([{ program: "MAWD", contextData: {} }])).toBe(false);
  });
});
