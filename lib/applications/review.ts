import crypto from "node:crypto";
import type { ApplicationStatus } from "@/lib/db/models/Application";
import type { ApplicationDocReview } from "@/lib/db/models/ApplicationDocument";

/* ----------------------------------------------------------------------------
 * Pure helpers for the reviewed-application flow — no DB, so they unit-test
 * directly. Decides who needs review, the initial gate status, and whether an
 * admin is allowed to approve.
 * ------------------------------------------------------------------------- */

/** Account types that must be reviewed & approved before full access. */
export const REVIEWED_ACCOUNT_TYPES = ["family", "fiduciary", "nonprofit"] as const;
export type ReviewedAccountType = (typeof REVIEWED_ACCOUNT_TYPES)[number];

/** True when this account type acts for someone else and needs admin review. */
export function isReviewedRole(accountType: string | undefined | null): accountType is ReviewedAccountType {
  return !!accountType && (REVIEWED_ACCOUNT_TYPES as readonly string[]).includes(accountType);
}

/** The `User.applicationStatus` a new account starts with, based on its role. */
export function initialApplicationStatus(accountType: string | undefined | null): ApplicationStatus | "approved" {
  return isReviewedRole(accountType) ? "pending_review" : "approved";
}

/**
 * An admin may approve only once at least one document is on file AND verified.
 * Locked with the user: approval is blocked until a valid document is present.
 */
export function canApprove(docs: { reviewStatus: ApplicationDocReview }[]): boolean {
  return docs.some((d) => d.reviewStatus === "verified");
}

/** A persistent, URL-safe token for the public status link. */
export function newStatusToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** Short human label for a status, for badges and email copy. */
export function applicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
    default:
      return "Under review";
  }
}
