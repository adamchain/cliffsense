import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";
import User, { type UserDoc } from "@/lib/db/models/User";
import { isBeneWatchAdminEmail } from "@/lib/admin/staff-email";

export type StaffAccount =
  | { ok: true; user: UserDoc }
  | { ok: false; reason: "domain" | "disabled" };

/**
 * Find or create the user row a Bene-Watch address signs into the console with.
 * An existing product account at that address is reused. A disabled account
 * cannot receive a code.
 */
export async function prepareStaffAccount(email: string): Promise<StaffAccount> {
  const address = email.toLowerCase().trim();
  if (!isBeneWatchAdminEmail(address)) return { ok: false, reason: "domain" };

  await connectDB();
  const existing = await User.findOne({ email: address });
  if (existing) {
    if (existing.status === "disabled") return { ok: false, reason: "disabled" };
    return { ok: true, user: existing };
  }

  const local = address.split("@")[0] ?? "Staff";
  const name = local.replace(/^./, (c) => c.toUpperCase());
  try {
    const created = await User.create({
      email: address,
      hashedPassword: bcrypt.hashSync(crypto.randomBytes(24).toString("base64url"), 10),
      accountType: "fiduciary",
      name,
      isAdmin: false,
      status: "active",
      applicationStatus: "approved",
      onboardingStep: "complete",
    });
    return { ok: true, user: created };
  } catch {
    const again = await User.findOne({ email: address });
    if (!again) return { ok: false, reason: "domain" };
    if (again.status === "disabled") return { ok: false, reason: "disabled" };
    return { ok: true, user: again };
  }
}
