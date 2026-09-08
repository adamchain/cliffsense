import type { Types } from "mongoose";
import BankConnection from "@/lib/db/models/BankConnection";

/** Shown on Home and Money — live Plaid links plus imported/demo sources. */
export const VISIBLE_BANK_STATUS = { $ne: "disconnected" as const };

export type VisibleBankConnection = {
  id: string;
  institutionName: string;
  status: string;
  source: "plaid" | "import";
  lastSyncAt: string | null;
  accounts: { name: string; mask: string; currentBalanceCents: number }[];
};

export function visibleBankQuery(beneficiaryId: Types.ObjectId | string) {
  return { beneficiaryId, status: VISIBLE_BANK_STATUS };
}

export async function countVisibleBankConnections(
  beneficiaryId: Types.ObjectId | string,
): Promise<number> {
  return BankConnection.countDocuments(visibleBankQuery(beneficiaryId));
}

export async function listVisibleBankConnections(
  beneficiaryId: Types.ObjectId | string,
): Promise<VisibleBankConnection[]> {
  const raw = await BankConnection.find(visibleBankQuery(beneficiaryId))
    .select("institutionName status accounts lastSyncAt source")
    .sort({ source: 1, updatedAt: -1 })
    .lean();
  return raw.map((c) => ({
    id: c._id.toString(),
    institutionName: c.institutionName || (c.source === "import" ? "Imported statements" : "Bank"),
    status: c.status,
    source: c.source === "import" ? "import" : "plaid",
    lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
    accounts: (c.accounts ?? []).map((a) => ({
      name: a.name,
      mask: a.mask,
      currentBalanceCents: a.currentBalanceCents,
    })),
  }));
}
