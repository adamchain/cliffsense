import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import User from "@/lib/db/models/User";
import { logActivity } from "@/lib/activity/log-activity";
import type { Types } from "mongoose";
import mongoose from "mongoose";

export type BeneficiaryAccessRole = "owner" | "co_manager" | "viewer";

function namesFromUser(name: string | undefined, email: string | undefined): { firstName: string; lastName: string } {
  const raw = String(name ?? "").trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? "Owner";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : firstName;
    return { firstName, lastName };
  }
  const local = (email ?? "user").split("@")[0]?.trim() || "user";
  return { firstName: local.slice(0, 60), lastName: "Profile" };
}

async function ensureOwnerAccessRow(beneficiaryId: Types.ObjectId, ownerUserId: string): Promise<void> {
  const now = new Date();
  const uid = new mongoose.Types.ObjectId(ownerUserId);
  await BeneficiaryAccess.updateOne(
    { beneficiaryId, userId: uid },
    {
      $setOnInsert: {
        beneficiaryId,
        userId: uid,
        role: "owner",
        status: "active",
        invitedAt: now,
        acceptedAt: now,
        invitedByUserId: null,
      },
    },
    { upsert: true },
  );
}

/**
 * Owner beneficiary (`isOwner: true`) used for Plaid and primary thresholds.
 * Creates one from the user record if missing (e.g. partial saves or legacy accounts).
 */
export async function getOrCreateOwnerBeneficiaryForUser(
  ownerUserId: string,
): Promise<{ _id: Types.ObjectId } | null> {
  await connectDB();
  const existing = await Beneficiary.findOne({ ownerUserId, isOwner: true }).select("_id").lean();
  if (existing?._id) {
    await ensureOwnerAccessRow(existing._id, ownerUserId);
    return { _id: existing._id };
  }

  const user = await User.findById(ownerUserId).select("name email").lean();
  if (!user) {
    return null;
  }

  const { firstName, lastName } = namesFromUser(user.name, user.email);
  const ben = await Beneficiary.create({
    ownerUserId,
    isOwner: true,
    firstName,
    lastName,
    state: "",
    county: "",
    householdSize: 1,
  });

  await ensureOwnerAccessRow(ben._id, ownerUserId);

  await logActivity({
    userId: ownerUserId,
    beneficiaryId: ben._id,
    category: "beneficiary",
    action: "beneficiary.created",
    resourceType: "beneficiary",
    resourceId: ben._id.toString(),
    details: { isOwner: true, source: "ensure-owner-for-plaid" },
  });

  return { _id: ben._id };
}

export async function getPrimaryBeneficiaryForUser(
  ownerUserId: string,
): Promise<{ _id: Types.ObjectId } | null> {
  await connectDB();
  const owner =
    (await Beneficiary.findOne({ ownerUserId, isOwner: true }).select("_id").lean()) ??
    (await Beneficiary.findOne({ ownerUserId }).sort({ createdAt: 1 }).select("_id").lean());
  return owner?._id ? { _id: owner._id } : null;
}

/** Active role for this user on the beneficiary, or null. Lazily seeds an owner row for legacy data. */
export async function getBeneficiaryAccessRole(
  userId: string,
  beneficiaryId: string,
): Promise<BeneficiaryAccessRole | null> {
  await connectDB();
  const bid = beneficiaryId;
  const uid = new mongoose.Types.ObjectId(userId);
  const row = await BeneficiaryAccess.findOne({
    beneficiaryId: bid,
    userId: uid,
    status: "active",
  })
    .select("role")
    .lean();
  if (row?.role) {
    return row.role as BeneficiaryAccessRole;
  }

  const b = await Beneficiary.findById(bid).select("ownerUserId").lean();
  if (!b?.ownerUserId) {
    return null;
  }
  if (b.ownerUserId.toString() !== userId) {
    return null;
  }
  await ensureOwnerAccessRow(b._id, userId);
  return "owner";
}

export async function assertBeneficiaryAccess(userId: string, beneficiaryId: string): Promise<boolean> {
  const role = await getBeneficiaryAccessRole(userId, beneficiaryId);
  return role != null;
}

/** Mutations (Plaid, recategorize, thresholds, vault upload, exports). Viewers are read-only. */
export async function assertBeneficiaryWriteAccess(userId: string, beneficiaryId: string): Promise<boolean> {
  const role = await getBeneficiaryAccessRole(userId, beneficiaryId);
  return role === "owner" || role === "co_manager";
}
