import { describe, expect, it } from "vitest";
import { enrollmentsFromScreening, isChoiceComplete, SCREENING_ITEMS } from "./screening";

describe("signup screening chart", () => {
  it("covers every program on the opening chart", () => {
    expect(SCREENING_ITEMS.map((i) => i.id)).toEqual([
      "ssdi",
      "dac",
      "ssi",
      "medicare_ab",
      "medicare_plan",
      "qmb",
      "slmb",
      "qi",
      "extra_help",
      "medicaid",
      "hcbs",
      "mawd",
      "wjs",
      "snap",
      "snt",
      "able",
    ]);
  });

  it("enrolls only current (or existing ABLE) programs, including DAC and WJS as MAWD", () => {
    const enrolled = enrollmentsFromScreening({
      answers: {
        ssdi: "current",
        dac: "current",
        ssi: "possible",
        qmb: "no",
        extra_help: "unknown",
        snap: "current",
        able: "exists",
        hcbs: "current",
        mawd: "no",
        wjs: "current",
        medicaid: "current",
        snt: "exists",
      },
      medicaidCategory: "abd",
    }).map((e) => e.program);
    expect(enrolled.sort()).toEqual(["ABLE", "DAC", "MAWD", "MedicaidABD", "MedicaidWaiver", "SNAP", "SSDI"].sort());
  });

  it("does not enroll generic Medicaid without a known category", () => {
    const enrolled = enrollmentsFromScreening({
      answers: { medicaid: "current" },
      medicaidCategory: "unknown",
    });
    expect(enrolled).toEqual([]);
  });

  it("requires a Medicaid category when the answer is current", () => {
    const item = SCREENING_ITEMS.find((i) => i.id === "medicaid")!;
    expect(isChoiceComplete(item, "current", "")).toBe(false);
    expect(isChoiceComplete(item, "current", "abd")).toBe(true);
    expect(isChoiceComplete(item, "no", "")).toBe(true);
  });
});
