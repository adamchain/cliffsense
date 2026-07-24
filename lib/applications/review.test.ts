import { describe, it, expect } from "vitest";
import {
  isReviewedRole,
  initialApplicationStatus,
  canApprove,
  newStatusToken,
} from "@/lib/applications/review";

describe("isReviewedRole", () => {
  it("flags roles that act for someone else", () => {
    expect(isReviewedRole("family")).toBe(true);
    expect(isReviewedRole("fiduciary")).toBe(true);
    expect(isReviewedRole("nonprofit")).toBe(true);
  });
  it("does not flag self-beneficiaries or unknowns", () => {
    expect(isReviewedRole("beneficiary")).toBe(false);
    expect(isReviewedRole(undefined)).toBe(false);
    expect(isReviewedRole("")).toBe(false);
  });
});

describe("initialApplicationStatus", () => {
  it("self-beneficiary is approved (no gate)", () => {
    expect(initialApplicationStatus("beneficiary")).toBe("approved");
  });
  it("reviewed roles start pending_review", () => {
    expect(initialApplicationStatus("family")).toBe("pending_review");
    expect(initialApplicationStatus("fiduciary")).toBe("pending_review");
    expect(initialApplicationStatus("nonprofit")).toBe("pending_review");
  });
});

describe("canApprove", () => {
  it("is false with no documents", () => {
    expect(canApprove([])).toBe(false);
  });
  it("is false when documents are only pending or rejected", () => {
    expect(canApprove([{ reviewStatus: "pending" }, { reviewStatus: "rejected" }])).toBe(false);
  });
  it("is true once at least one document is verified", () => {
    expect(canApprove([{ reviewStatus: "pending" }, { reviewStatus: "verified" }])).toBe(true);
  });
});

describe("newStatusToken", () => {
  it("produces a URL-safe, non-empty, unique-ish token", () => {
    const a = newStatusToken();
    const b = newStatusToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(20);
    expect(a).not.toBe(b);
  });
});
