import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import { canManageSharing } from "@/lib/beneficiaries/invites";
import { logActivity } from "@/lib/activity/log-activity";

/** Revoke a person's access to a beneficiary. The owner row cannot be revoked. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, userId } = await ctx.params;
  if (!(await canManageSharing(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const beneficiaryId = new mongoose.Types.ObjectId(id);
  const target = await BeneficiaryAccess.findOne({
    beneficiaryId,
    userId: new mongoose.Types.ObjectId(userId),
    status: "active",
  });
  if (!target) {
    return NextResponse.json({ error: "Access not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot revoke the owner" }, { status: 400 });
  }

  target.status = "revoked";
  await target.save();

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "beneficiary",
    action: "beneficiary.access_revoked",
    resourceType: "user",
    resourceId: userId,
  });

  return NextResponse.json({ ok: true });
}
