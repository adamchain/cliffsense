import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function betaAgreementAccepted(userId: string): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("betaAgreementAcceptedAt").lean();
  return Boolean(user?.betaAgreementAcceptedAt);
}
