import { describe, expect, it } from "vitest";
import {
  normalizeMerchantKey,
  rowMatchesSimilar,
  similarMatchFrom,
} from "./similar";

describe("similar transactions", () => {
  it("prefers merchantName as match key", () => {
    const m = similarMatchFrom({
      _id: "1",
      beneficiaryId: { toString: () => "b" },
      merchantName: "Acme Care Services",
      name: "ACME PAYROLL",
      amountCents: -52000,
      userCategory: "unclear",
    });
    expect(m?.matchField).toBe("merchantName");
    expect(m?.matchValue).toBe(normalizeMerchantKey("Acme Care Services"));
  });

  it("matches same merchant ignoring case/spacing", () => {
    const m = similarMatchFrom({
      _id: "1",
      beneficiaryId: { toString: () => "b" },
      merchantName: "Acme Care",
      name: "",
      amountCents: -100,
      userCategory: "unclear",
    });
    expect(m).not.toBeNull();
    expect(rowMatchesSimilar({ merchantName: "ACME  CARE" }, m!)).toBe(true);
    expect(rowMatchesSimilar({ merchantName: "Other Co" }, m!)).toBe(false);
  });

  it("falls back to name prefix matching", () => {
    const m = similarMatchFrom({
      _id: "1",
      beneficiaryId: { toString: () => "b" },
      merchantName: "",
      name: "DIRECT DEP ACME CARE",
      amountCents: -100,
      userCategory: "unclear",
    });
    expect(m?.matchField).toBe("name");
    expect(rowMatchesSimilar({ name: "DIRECT DEP ACME CARE 08/01" }, m!)).toBe(true);
  });
});
