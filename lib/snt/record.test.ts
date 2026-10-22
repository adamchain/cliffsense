import { describe, expect, it } from "vitest";
import {
  centsToDollarInput,
  hasSupportingProof,
  parseDollarsToCents,
  paymentProofLabel,
} from "./record";

describe("SNT disbursement records", () => {
  it("parses dollar amounts into cents", () => {
    expect(parseDollarsToCents("1500")).toBe(150_000);
    expect(parseDollarsToCents("$1,500.50")).toBe(150_050);
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("-5")).toBeNull();
    expect(centsToDollarInput(150_050)).toBe("1500.50");
  });

  it("keeps a request or approval distinct from a verified payment", () => {
    expect(paymentProofLabel("requested", "invoice.pdf", ["a"])).toBe("Not a completed payment");
    expect(paymentProofLabel("approved", "", [])).toBe("Not a completed payment");
    expect(paymentProofLabel("paid", "", [])).toBe("Marked paid — proof still missing");
    expect(paymentProofLabel("paid", "Trustee statement", [])).toBe("Payment with supporting proof");
    expect(hasSupportingProof("", ["doc"])).toBe(true);
    expect(hasSupportingProof("  ", [])).toBe(false);
  });
});
