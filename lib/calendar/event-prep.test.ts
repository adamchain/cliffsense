import { describe, expect, it } from "vitest";
import { buildEventPrepPackage } from "./event-prep";

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
