import { describe, expect, it } from "vitest";
import { resolveActiveBeneficiaryId } from "./resolve-active";

describe("resolveActiveBeneficiaryId", () => {
  it("uses a requested id the user can access", () => {
    expect(resolveActiveBeneficiaryId("b", ["a", "b"], "a")).toBe("b");
  });

  it("falls back to the owner profile when the cookie is missing or foreign", () => {
    expect(resolveActiveBeneficiaryId(null, ["a", "b"], "a")).toBe("a");
    expect(resolveActiveBeneficiaryId("zzz", ["a", "b"], "a")).toBe("a");
  });

  it("uses the first accessible profile when there is no owner", () => {
    expect(resolveActiveBeneficiaryId(null, ["shared"], null)).toBe("shared");
  });
});
