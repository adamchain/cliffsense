import Application, { type ApplicationDoc } from "@/lib/db/models/Application";
import { connectDB } from "@/lib/db/mongodb";
import { isReviewedRole, newStatusToken } from "@/lib/applications/review";

/**
 * Return the user's review Application, creating an empty one if they're a
 * reviewed role but somehow don't have one yet (e.g. the email at registration
 * succeeded but the Application insert didn't). Returns null for non-reviewed
 * roles. Keeps the /application page from looping when the record is missing.
 */
export async function ensureApplication(
  userId: string,
  accountType: string | undefined,
): Promise<ApplicationDoc | null> {
  await connectDB();
  const existing = await Application.findOne({ userId });
  if (existing) return existing;
  if (!isReviewedRole(accountType)) return null;
  return Application.create({
    userId,
    accountType,
    status: "pending_review",
    statusToken: newStatusToken(),
    timeline: [{ type: "submitted", at: new Date(), note: "Application started." }],
  });
}
