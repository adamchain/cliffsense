import { describe, expect, it } from "vitest";
import { parseCsv } from "./parse-csv";

describe("parseCsv", () => {
  it("parses a simple file with headers", () => {
    const { headers, rows } = parseCsv("Date,Amount,Description\n2025-01-02,-10.00,Coffee");
    expect(headers).toEqual(["Date", "Amount", "Description"]);
    expect(rows).toEqual([["2025-01-02", "-10.00", "Coffee"]]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    const csv = 'Date,Description,Amount\n2025-01-02,"ACME, Inc. ""HQ""",100.00';
    const { rows } = parseCsv(csv);
    expect(rows[0]).toEqual(["2025-01-02", 'ACME, Inc. "HQ"', "100.00"]);
  });

  it("handles quoted fields containing newlines", () => {
    const csv = 'Date,Note\n2025-01-02,"line one\nline two"';
    const { rows } = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0][1]).toBe("line one\nline two");
  });

  it("strips a UTF-8 BOM and handles CRLF line endings", () => {
    const csv = "﻿Date,Amount\r\n2025-01-02,5.00\r\n";
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(["Date", "Amount"]);
    expect(rows).toEqual([["2025-01-02", "5.00"]]);
  });

  it("pads short rows to the header width and drops blank lines", () => {
    const csv = "A,B,C\n1,2\n\n4,5,6";
    const { rows } = parseCsv(csv);
    expect(rows).toEqual([
      ["1", "2", ""],
      ["4", "5", "6"],
    ]);
  });
});
