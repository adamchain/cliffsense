import mongoose from "mongoose";
import { reconcileOpenAlerts } from "@/lib/alerts/reconcile-open-alerts";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";

/**
 * Unread alerts for the account currently on screen. A green program drops
 * alerts left over from an earlier setup before the number is counted, so the
 * sidebar and the bell match that account.
 */
export async function countUnreadAlertsForUser(
  userId: string,
  activeBeneficiaryId?: string | null,
): Promise<number> {
  await connectDB();
  if (!activeBeneficiaryId || !mongoose.isValidObjectId(activeBeneficiaryId)) return 0;
  const access = await BeneficiaryAccess.findOne({
    userId,
    beneficiaryId: activeBeneficiaryId,
    status: "active",
  })
    .select("_id")
    .lean();
  if (!access) return 0;
  const beneficiaryId = new mongoose.Types.ObjectId(activeBeneficiaryId);
  await reconcileOpenAlerts(beneficiaryId).catch(() => 0);
  return Alert.countDocuments({
    beneficiaryId,
    status: "new",
  });
}
