import { describe, expect, it } from "vitest";
import { buildZip } from "./zip";
import { renderReportPdf } from "./pdf";

describe("buildZip", () => {
  it("produces a valid ZIP archive (PK signature)", () => {
    const buf = buildZip({ "a.csv": "x,y\n1,2", "b.json": "[]" });
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
  });
});

describe("renderReportPdf", () => {
  it("produces a valid PDF (%PDF header) and paginates long input", async () => {
    const lines = Array.from({ length: 400 }, (_, i) => `row ${i} ${"x".repeat(120)}`);
    const buf = await renderReportPdf("Test", "subtitle", [{ heading: "data", lines }]);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
