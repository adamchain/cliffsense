import { describe, expect, it } from "vitest";
import { categoryHandoffsFor } from "./category-handoffs";

describe("category handoffs", () => {
  it("offers 1619(b) and MAWD when SSI is enrolled", () => {
    const ids = categoryHandoffsFor(["SSI"]).map((h) => h.id);
    expect(ids).toEqual(expect.arrayContaining(["1619b", "mawd"]));
  });

  it("offers Marketplace when MAGI is enrolled", () => {
    expect(categoryHandoffsFor(["MedicaidMAGI"]).map((h) => h.id)).toContain("marketplace");
  });
});
