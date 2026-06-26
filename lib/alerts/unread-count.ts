import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";

/**
 * Count of unread ("new") alerts across every beneficiary the user actively has
 * access to — the number shown on the topbar bell badge. Mirrors the access
 * scoping used by the digest so the badge and the /alerts page agree.
 */
export async function countUnreadAlertsForUser(userId: string): Promise<number> {
  await connectDB();
  const accessRows = await BeneficiaryAccess.find({ userId, status: "active" })
    .select("beneficiaryId")
    .lean();
  const beneficiaryIds = accessRows.map((r) => r.beneficiaryId);
  if (beneficiaryIds.length === 0) {
    return 0;
  }
  return Alert.countDocuments({
    beneficiaryId: { $in: beneficiaryIds },
    status: "new",
  });
}
