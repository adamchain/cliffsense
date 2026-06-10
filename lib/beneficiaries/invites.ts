import crypto from "node:crypto";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import Invite from "@/lib/db/models/Invite";
import User from "@/lib/db/models/User";
import { logActivity } from "@/lib/activity/log-activity";
import { appUrl, sendEmail, withDisclaimer } from "@/lib/email/mailer";
import { getBeneficiaryAccessRole } from "@/lib/beneficiaries/access";

export type InviteRole = "co_manager" | "viewer";

const INVITE_TTL_DAYS = 14;

function newToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** Owner or co-manager may manage sharing. */
export async function canManageSharing(userId: string, beneficiaryId: string): Promise<boolean> {
  const role = await getBeneficiaryAccessRole(userId, beneficiaryId);
  return role === "owner" || role === "co_manager";
}

export async function createInvite(params: {
  beneficiaryId: string;
  email: string;
  role: InviteRole;
  invitedByUserId: string;
}): Promise<{ ok: true; inviteId: string } | { ok: false; error: string }> {
  await connectDB();
  const email = params.email.toLowerCase().trim();
  if (!email) {
    return { ok: false, error: "Email is required" };
  }

  const ben = await Beneficiary.findById(params.beneficiaryId).select("_id firstName lastName").lean();
  if (!ben) {
    return { ok: false, error: "Beneficiary not found" };
  }

  // Already has active access?
  const existingUser = await User.findOne({ email }).select("_id").lean();
  if (existingUser) {
    const active = await BeneficiaryAccess.findOne({
      beneficiaryId: ben._id,
      userId: existingUser._id,
      status: "active",
    })
      .select("_id")
      .lean();
    if (active) {
      return { ok: false, error: "That person already has access" };
    }
  }

  const token = newToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400000);

  // Supersede any prior pending invite for the same email + beneficiary.
  await Invite.updateMany(
    { beneficiaryId: ben._id, email, status: "pending" },
    { $set: { status: "revoked" } },
  );

  const invite = await Invite.create({
    beneficiaryId: ben._id,
    email,
    role: params.role,
    token,
    invitedByUserId: new mongoose.Types.ObjectId(params.invitedByUserId),
    status: "pending",
    expiresAt,
  });

  const link = `${appUrl()}/invite/${token}`;
  const name = `${ben.firstName ?? ""} ${ben.lastName ?? ""}`.trim() || "a beneficiary";
  await sendEmail({
    to: email,
    subject: "You've been invited to CliffSense",
    text: withDisclaimer(
      `You've been invited to help monitor benefit thresholds for ${name} on CliffSense as a ${
        params.role === "co_manager" ? "co-manager" : "viewer"
      }.\n\nAccept the invitation (sign in or create an account with this email address):\n${link}\n\nThis link expires in ${INVITE_TTL_DAYS} days.`,
    ),
  });

  await logActivity({
    userId: params.invitedByUserId,
    beneficiaryId: ben._id as Types.ObjectId,
    category: "beneficiary",
    action: "beneficiary.invited",
    resourceType: "invite",
    resourceId: invite._id.toString(),
    details: { email, role: params.role },
  });

  return { ok: true, inviteId: invite._id.toString() };
}

export async function acceptInvite(params: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<{ ok: true; beneficiaryId: string } | { ok: false; error: string }> {
  await connectDB();
  const invite = await Invite.findOne({ token: params.token.trim() });
  if (!invite) {
    return { ok: false, error: "Invitation not found" };
  }
  if (invite.status !== "pending") {
    return { ok: false, error: "This invitation is no longer valid" };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    invite.status = "revoked";
    await invite.save();
    return { ok: false, error: "This invitation has expired" };
  }
  if (invite.email.toLowerCase() !== params.userEmail.toLowerCase().trim()) {
    return {
      ok: false,
      error: "This invitation was sent to a different email address. Sign in with that address.",
    };
  }

  const uid = new mongoose.Types.ObjectId(params.userId);
  await BeneficiaryAccess.updateOne(
    { beneficiaryId: invite.beneficiaryId, userId: uid },
    {
      $set: {
        role: invite.role,
        status: "active",
        acceptedAt: new Date(),
        invitedByUserId: invite.invitedByUserId,
      },
      $setOnInsert: {
        beneficiaryId: invite.beneficiaryId,
        userId: uid,
        invitedAt: invite.createdAt ?? new Date(),
      },
    },
    { upsert: true },
  );

  invite.status = "accepted";
  invite.acceptedAt = new Date();
  invite.acceptedByUserId = uid;
  await invite.save();

  await logActivity({
    userId: params.userId,
    beneficiaryId: invite.beneficiaryId as Types.ObjectId,
    category: "beneficiary",
    action: "beneficiary.access_granted",
    resourceType: "invite",
    resourceId: invite._id.toString(),
    details: { role: invite.role },
  });

  return { ok: true, beneficiaryId: invite.beneficiaryId.toString() };
}
