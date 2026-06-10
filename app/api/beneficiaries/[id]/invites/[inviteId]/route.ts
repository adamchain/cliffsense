import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Invite from "@/lib/db/models/Invite";
import { canManageSharing } from "@/lib/beneficiaries/invites";
import { logActivity } from "@/lib/activity/log-activity";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; inviteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, inviteId } = await ctx.params;
  if (!(await canManageSharing(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const result = await Invite.updateOne(
    { _id: new mongoose.Types.ObjectId(inviteId), beneficiaryId: new mongoose.Types.ObjectId(id), status: "pending" },
    { $set: { status: "revoked" } },
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId: new mongoose.Types.ObjectId(id),
    category: "beneficiary",
    action: "beneficiary.invite_revoked",
    resourceType: "invite",
    resourceId: inviteId,
  });

  return NextResponse.json({ ok: true });
}
