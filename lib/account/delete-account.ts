import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/db/models/ActivityLog";
import Alert from "@/lib/db/models/Alert";
import AuthToken from "@/lib/db/models/AuthToken";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import ClassificationRule from "@/lib/db/models/ClassificationRule";
import Document from "@/lib/db/models/Document";
import Export from "@/lib/db/models/Export";
import Invite from "@/lib/db/models/Invite";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Threshold from "@/lib/db/models/Threshold";
import Transaction from "@/lib/db/models/Transaction";
import User from "@/lib/db/models/User";
import { decryptPlaidToken } from "@/lib/plaid/crypto";
import { getPlaidClient, isPlaidExchangeConfigured } from "@/lib/plaid/server";

/**
 * Hard-deletes a user and everything they own. Revokes Plaid items first (best
 * effort), removes per-beneficiary data for every beneficiary they own, drops
 * the user's access to others' beneficiaries, and finally deletes the account.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await connectDB();

  const owned = await Beneficiary.find({ ownerUserId: userId }).select("_id").lean();
  const beneficiaryIds = owned.map((b) => b._id as Types.ObjectId);

  if (beneficiaryIds.length > 0) {
    // Revoke Plaid items so tokens stop working at the source.
    if (isPlaidExchangeConfigured()) {
      const client = getPlaidClient();
      const connections = await BankConnection.find({
        beneficiaryId: { $in: beneficiaryIds },
      })
        .select("plaidAccessTokenEncrypted")
        .lean();
      for (const conn of connections) {
        try {
          const accessToken = decryptPlaidToken(conn.plaidAccessTokenEncrypted as string);
          await client.itemRemove({ access_token: accessToken });
        } catch (e) {
          console.warn("itemRemove during account deletion", e);
        }
      }
    }

    await Promise.all([
      Transaction.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      RecurringStream.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      BankConnection.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      Alert.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      Document.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      Export.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      Threshold.deleteMany({ beneficiaryId: { $in: beneficiaryIds }, scope: "user" }),
      ClassificationRule.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      BeneficiaryAccess.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      Invite.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
      ActivityLog.deleteMany({ beneficiaryId: { $in: beneficiaryIds } }),
    ]);

    await Beneficiary.deleteMany({ _id: { $in: beneficiaryIds } });
  }

  await Promise.all([
    BeneficiaryAccess.deleteMany({ userId }),
    AuthToken.deleteMany({ userId }),
    ActivityLog.deleteMany({ userId }),
  ]);

  await User.deleteOne({ _id: userId });
}
