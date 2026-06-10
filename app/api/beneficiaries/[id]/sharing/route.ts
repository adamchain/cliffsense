import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import Invite from "@/lib/db/models/Invite";
import User from "@/lib/db/models/User";
import { canManageSharing, createInvite } from "@/lib/beneficiaries/invites";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["co_manager", "viewer"]),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canManageSharing(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const beneficiaryId = new mongoose.Types.ObjectId(id);
  const [accessRows, invites] = await Promise.all([
    BeneficiaryAccess.find({ beneficiaryId, status: "active" }).lean(),
    Invite.find({ beneficiaryId, status: "pending" }).sort({ createdAt: -1 }).lean(),
  ]);

  const userIds = accessRows.map((r) => r.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("email name").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return NextResponse.json({
    access: accessRows.map((r) => {
      const u = userMap.get(String(r.userId));
      return {
        userId: String(r.userId),
        email: u?.email ?? "",
        name: u?.name ?? "",
        role: r.role,
        isSelf: String(r.userId) === session.user!.id,
      };
    }),
    invites: invites.map((i) => ({
      id: String(i._id),
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canManageSharing(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = inviteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await createInvite({
    beneficiaryId: id,
    email: parsed.data.email,
    role: parsed.data.role,
    invitedByUserId: session.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, inviteId: result.inviteId });
}
