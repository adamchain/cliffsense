import { describe, expect, it } from "vitest";
import { openAlertShouldClear } from "@/lib/alerts/reconcile-open-alerts";

describe("open alert badge", () => {
  it("clears an alert from a program that is now green", () => {
    expect(
      openAlertShouldClear({
        reportedByUser: false,
        alertPrograms: ["SNAP"],
        enrolled: ["SNAP", "QMB"],
        hotPrograms: [],
      }),
    ).toBe(true);
  });

  it("keeps an alert while that program is still watch or concern", () => {
    expect(
      openAlertShouldClear({
        reportedByUser: false,
        alertPrograms: ["QMB"],
        enrolled: ["SNAP", "QMB"],
        hotPrograms: ["QMB"],
      }),
    ).toBe(false);
  });

  it("clears alerts left over from a program that was removed", () => {
    expect(
      openAlertShouldClear({
        reportedByUser: false,
        alertPrograms: ["MedicaidWaiver"],
        enrolled: ["SNAP"],
        hotPrograms: ["SNAP"],
      }),
    ).toBe(true);
  });

  it("keeps a notice the user reported, even when the screen is green", () => {
    expect(
      openAlertShouldClear({
        reportedByUser: true,
        alertPrograms: ["SNAP"],
        enrolled: ["SNAP"],
        hotPrograms: [],
      }),
    ).toBe(false);
  });
});
