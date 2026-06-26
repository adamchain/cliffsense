import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

const schema = z
  .object({
    isAdmin: z.boolean().optional(),
    status: z.enum(["active", "disabled"]).optional(),
  })
  .refine((d) => d.isAdmin !== undefined || d.status !== undefined, {
    message: "No changes requested",
  });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();
  const target = await User.findById(id).select("email isAdmin status").lean();
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const actorId = session.user.id;
  const isSelf = target._id.toString() === actorId;
  const meta = clientMeta(req);
  const updates: { isAdmin?: boolean; status?: "active" | "disabled" } = {};

  if (parsed.data.isAdmin !== undefined && parsed.data.isAdmin !== target.isAdmin) {
    if (isSelf && parsed.data.isAdmin === false) {
      return NextResponse.json(
        { error: "You cannot revoke your own admin access." },
        { status: 400 },
      );
    }
    updates.isAdmin = parsed.data.isAdmin;
  }
  if (parsed.data.status !== undefined && parsed.data.status !== target.status) {
    if (isSelf && parsed.data.status === "disabled") {
      return NextResponse.json(
        { error: "You cannot disable your own account." },
        { status: 400 },
      );
    }
    updates.status = parsed.data.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await User.updateOne({ _id: id }, { $set: updates });

  if (updates.isAdmin !== undefined) {
    await logAdminAction({
      actorUserId: actorId,
      actorEmail: session.user.email,
      action: updates.isAdmin ? "grant_admin" : "revoke_admin",
      targetUserId: id,
      targetEmail: target.email,
      ...meta,
    });
  }
  if (updates.status !== undefined) {
    await logAdminAction({
      actorUserId: actorId,
      actorEmail: session.user.email,
      action: updates.status === "disabled" ? "disable_user" : "enable_user",
      targetUserId: id,
      targetEmail: target.email,
      ...meta,
    });
  }

  return NextResponse.json({ ok: true });
}
