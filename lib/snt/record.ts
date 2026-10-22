/** Manual Special Needs Trust disbursement register. Not a bank feed. */

export const SNT_PAYMENT_STATUSES = ["requested", "approved", "paid"] as const;
export type SntPaymentStatus = (typeof SNT_PAYMENT_STATUSES)[number];

export const SNT_REVIEW_STATUSES = ["none", "needs_review", "reviewed"] as const;
export type SntReviewStatus = (typeof SNT_REVIEW_STATUSES)[number];

export const SNT_PAYMENT_LABEL: Record<SntPaymentStatus, string> = {
  requested: "Requested",
  approved: "Approved — not yet a payment",
  paid: "Paid",
};

export const SNT_REVIEW_LABEL: Record<SntReviewStatus, string> = {
  none: "No review flag",
  needs_review: "Needs benefit review",
  reviewed: "Review noted",
};

const MAX_CENTS = 1_000_000_000;

export function parseDollarsToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return cents;
}

export function centsToDollarInput(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  return (safe / 100).toFixed(2);
}

export function hasSupportingProof(proofNote: string, documentIds: readonly string[]): boolean {
  return proofNote.trim().length > 0 || documentIds.length > 0;
}

/** A request or approval is never treated as a verified payment. */
export function paymentProofLabel(
  status: SntPaymentStatus,
  proofNote: string,
  documentIds: readonly string[],
): string {
  if (status !== "paid") return "Not a completed payment";
  return hasSupportingProof(proofNote, documentIds)
    ? "Payment with supporting proof"
    : "Marked paid — proof still missing";
}

export type SntProfileView = {
  trustName: string;
  trusteeName: string;
  trusteeContact: string;
  financialInstitution: string;
};

export type SntDisbursementView = {
  id: string;
  trustName: string;
  trusteeName: string;
  financialInstitution: string;
  paymentDate: string | null;
  amountCents: number;
  payee: string;
  purpose: string;
  status: SntPaymentStatus;
  reviewStatus: SntReviewStatus;
  proofNote: string;
  documentIds: string[];
  followUpDate: string | null;
};

export const EMPTY_SNT_PROFILE: SntProfileView = {
  trustName: "",
  trusteeName: "",
  trusteeContact: "",
  financialInstitution: "",
};
