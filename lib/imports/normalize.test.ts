import { describe, expect, it } from "vitest";
import {
  detectMapping,
  normalizeRows,
  parseAmountToCents,
  parseDateToIso,
} from "./normalize";
import { parseCsv } from "./parse-csv";

describe("parseDateToIso", () => {
  it("passes through ISO dates (with or without time)", () => {
    expect(parseDateToIso("2025-01-05")).toBe("2025-01-05");
    expect(parseDateToIso("2025-01-05T12:00:00Z")).toBe("2025-01-05");
  });

  it("parses US-style slashes and 2-digit years", () => {
    expect(parseDateToIso("01/05/2025")).toBe("2025-01-05");
    expect(parseDateToIso("1/5/25")).toBe("2025-01-05");
  });

  it("infers DD/MM when the first field can't be a month", () => {
    expect(parseDateToIso("13/02/2025")).toBe("2025-02-13");
  });

  it("returns empty string for junk", () => {
    expect(parseDateToIso("not a date")).toBe("");
    expect(parseDateToIso("")).toBe("");
  });
});

describe("parseAmountToCents", () => {
  it("parses currency symbols and thousands separators", () => {
    expect(parseAmountToCents("$1,234.56")).toBe(123456);
  });
  it("treats parentheses as negative", () => {
    expect(parseAmountToCents("(45.00)")).toBe(-4500);
  });
  it("treats a leading minus as negative", () => {
    expect(parseAmountToCents("-45")).toBe(-4500);
  });
  it("returns null for empty/unparseable input", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("--")).toBeNull();
  });
});

describe("detectMapping + normalizeRows", () => {
  it("normalizes a single-amount file with deposits-positive to app sign", () => {
    const csv = "Date,Description,Amount\n2025-01-02,Paycheck,1200.00\n2025-01-03,Coffee,-4.50";
    const { headers, rows, rawLines } = parseCsv(csv);
    const mapping = detectMapping(headers);
    expect(mapping).not.toBeNull();
    const { valid, invalid } = normalizeRows(rows, rawLines, mapping!);
    expect(invalid).toHaveLength(0);
    // Deposit (positive in file) becomes negative (money in) in app convention.
    expect(valid[0].amountCents).toBe(-120000);
    // Debit (negative in file) becomes positive (money out).
    expect(valid[1].amountCents).toBe(450);
  });

  it("honors depositsArePositive = false", () => {
    const csv = "Date,Amount\n2025-01-02,-1200.00";
    const { headers, rows, rawLines } = parseCsv(csv);
    const mapping = detectMapping(headers)!;
    if (mapping.amount.kind === "single") mapping.amount.depositsArePositive = false;
    const { valid } = normalizeRows(rows, rawLines, mapping);
    // With deposits-negative, a -1200 file value is money in → app negative.
    expect(valid[0].amountCents).toBe(-120000);
  });

  it("handles split debit/credit columns", () => {
    const csv = "Date,Description,Debit,Credit\n2025-01-02,Rent,900.00,\n2025-01-03,Refund,,25.00";
    const { headers, rows, rawLines } = parseCsv(csv);
    const mapping = detectMapping(headers)!;
    expect(mapping.amount.kind).toBe("split");
    const { valid } = normalizeRows(rows, rawLines, mapping);
    expect(valid[0].amountCents).toBe(90000); // debit = money out = positive
    expect(valid[1].amountCents).toBe(-2500); // credit = money in = negative
  });

  it("flags rows with bad dates/amounts as invalid", () => {
    const csv = "Date,Amount\ngarbage,5.00\n2025-01-02,notanumber";
    const { headers, rows, rawLines } = parseCsv(csv);
    const mapping = detectMapping(headers)!;
    const { valid, invalid } = normalizeRows(rows, rawLines, mapping);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(2);
  });

  it("returns null when required columns are absent", () => {
    expect(detectMapping(["Foo", "Bar"])).toBeNull();
  });
});
