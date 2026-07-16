import { describe, expect, it } from "vitest";
import { classifyAgainst, type ExistingTx } from "./detect-duplicates";
import type { NormalizedRow } from "./normalize";

function row(partial: Partial<NormalizedRow>): NormalizedRow {
  return {
    date: "2025-01-02",
    postedDate: "2025-01-02",
    amountCents: 1000,
    name: "",
    merchantName: "",
    category: "",
    suggestedUserCategory: "unclear",
    rawLine: "",
    ...partial,
  };
}

describe("classifyAgainst", () => {
  it("flags a row matching an existing transaction on date + amount", () => {
    const existing: ExistingTx[] = [
      { _id: "abc", date: "2025-01-02", amountCents: 1000, name: "Coffee Shop" },
    ];
    const [result] = classifyAgainst(existing, [row({ amountCents: 1000, name: "Coffee Shop" })]);
    expect(result.dupStatus).toBe("duplicate_existing");
    expect(result.dupTransactionId).toBe("abc");
  });

  it("treats same date+amount but clearly different names as new", () => {
    const existing: ExistingTx[] = [
      { _id: "abc", date: "2025-01-02", amountCents: 1000, name: "Coffee Shop" },
    ];
    const [result] = classifyAgainst(existing, [row({ amountCents: 1000, name: "Hardware Store" })]);
    expect(result.dupStatus).toBe("new");
  });

  it("matches when one description is a substring of the other", () => {
    const existing: ExistingTx[] = [
      { _id: "abc", date: "2025-01-02", amountCents: 1000, name: "AMZN Mktp US*1A2B3" },
    ];
    const [result] = classifyAgainst(existing, [row({ amountCents: 1000, name: "AMZN Mktp" })]);
    expect(result.dupStatus).toBe("duplicate_existing");
  });

  it("matches on date+amount when either description is missing", () => {
    const existing: ExistingTx[] = [{ _id: "abc", date: "2025-01-02", amountCents: 1000 }];
    const [result] = classifyAgainst(existing, [row({ amountCents: 1000, name: "Anything" })]);
    expect(result.dupStatus).toBe("duplicate_existing");
  });

  it("flags a repeated charge within the same file as duplicate_in_file", () => {
    const rows = [
      row({ amountCents: 500, name: "Bus fare" }),
      row({ amountCents: 500, name: "Bus fare" }),
    ];
    const results = classifyAgainst([], rows);
    expect(results[0].dupStatus).toBe("new");
    expect(results[1].dupStatus).toBe("duplicate_in_file");
  });

  it("does not flag same amount on different dates", () => {
    const existing: ExistingTx[] = [
      { _id: "abc", date: "2025-01-01", amountCents: 1000, name: "Coffee Shop" },
    ];
    const [result] = classifyAgainst(existing, [
      row({ date: "2025-01-02", amountCents: 1000, name: "Coffee Shop" }),
    ]);
    expect(result.dupStatus).toBe("new");
  });
});
