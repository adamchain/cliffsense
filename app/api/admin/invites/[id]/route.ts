import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Invite from "@/lib/db/models/Invite";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

/** Revoke a pending invite (soft — sets status to "revoked"). */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await connectDB();
  const invite = await Invite.findById(id);
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: `Invite is already ${invite.status}.` },
      { status: 400 },
    );
  }

  invite.status = "revoked";
  await invite.save();

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "revoke_invite",
    targetEmail: invite.email,
    details: { inviteId: id, role: invite.role, beneficiaryId: invite.beneficiaryId?.toString() },
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true });
}
