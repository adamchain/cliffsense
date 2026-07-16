import { createHash } from "node:crypto";
import mongoose from "mongoose";
import BankConnection from "@/lib/db/models/BankConnection";
import type { NormalizedRow } from "@/lib/imports/normalize";

/**
 * A stable synthetic id for an imported row, used as the Transaction
 * `plaidTransactionId`. Derived from the batch + the row's identifying fields
 * so that re-committing the same batch (or re-importing an identical file into
 * a fresh batch keyed the same way) upserts rather than duplicates. The batch
 * id is included so two genuinely separate imports of the same statement stay
 * independent unless the caller opts into cross-batch dedup via detection.
 */
export function makeImportKey(batchId: string, row: NormalizedRow): string {
  const basis = [batchId, row.date, row.amountCents, row.name, row.merchantName].join("|");
  const hash = createHash("sha1").update(basis).digest("hex").slice(0, 24);
  return `import:${hash}`;
}

/**
 * The synthetic "Imported statements" BankConnection that owns every imported
 * transaction for a beneficiary. Created on first import. It has no Plaid
 * access token and `source: "import"`, so the Plaid sync skips it.
 */
export async function getOrCreateImportConnection(
  beneficiaryId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId> {
  const plaidItemId = `import:${beneficiaryId.toString()}`;
  const existing = await BankConnection.findOne({ plaidItemId }).select("_id").lean();
  if (existing?._id) return existing._id;

  const created = await BankConnection.create({
    beneficiaryId,
    source: "import",
    plaidItemId,
    plaidAccessTokenEncrypted: "",
    institutionName: "Imported statements",
    status: "active",
    accounts: [],
  });
  return created._id;
}
