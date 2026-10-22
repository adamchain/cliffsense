import {
  EMPTY_SNT_PROFILE,
  type SntDisbursementView,
  type SntPaymentStatus,
  type SntProfileView,
  type SntReviewStatus,
} from "@/lib/snt/record";

type DisbursementRow = {
  _id: { toString(): string };
  trustName?: string | null;
  trusteeName?: string | null;
  financialInstitution?: string | null;
  paymentDate?: Date | null;
  amountCents: number;
  payee: string;
  purpose: string;
  status: string;
  reviewStatus?: string | null;
  proofNote?: string | null;
  documentIds?: readonly { toString(): string }[] | null;
  followUpDate?: Date | null;
};

function ymd(value: unknown): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

export function serializeSntProfile(raw: unknown): SntProfileView {
  const row = (raw ?? {}) as Partial<SntProfileView>;
  return {
    trustName: row.trustName ?? "",
    trusteeName: row.trusteeName ?? "",
    trusteeContact: row.trusteeContact ?? "",
    financialInstitution: row.financialInstitution ?? "",
  };
}

export function emptySntProfile(): SntProfileView {
  return { ...EMPTY_SNT_PROFILE };
}

export function serializeSntDisbursement(row: DisbursementRow): SntDisbursementView {
  return {
    id: row._id.toString(),
    trustName: row.trustName ?? "",
    trusteeName: row.trusteeName ?? "",
    financialInstitution: row.financialInstitution ?? "",
    paymentDate: ymd(row.paymentDate),
    amountCents: row.amountCents,
    payee: row.payee,
    purpose: row.purpose,
    status: row.status as SntPaymentStatus,
    reviewStatus: (row.reviewStatus ?? "none") as SntReviewStatus,
    proofNote: row.proofNote ?? "",
    documentIds: (row.documentIds ?? []).map((id) => id.toString()),
    followUpDate: ymd(row.followUpDate),
  };
}
