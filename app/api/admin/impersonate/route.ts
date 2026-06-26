import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, updateSession } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

const schema = z.object({ targetUserId: z.string().min(1) });

/** Start impersonation: swap the session to "view as" the target user. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { targetUserId } = parsed.data;

  await connectDB();
  const target = await User.findById(targetUserId).select("email status").lean();
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target._id.toString() === session.user.id) {
    return NextResponse.json({ error: "You cannot impersonate yourself." }, { status: 400 });
  }

  await updateSession({ action: "impersonate", targetUserId } as Parameters<typeof updateSession>[0]);

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "start_impersonation",
    targetUserId,
    targetEmail: target.email,
    details: { targetStatus: target.status },
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true });
}

/** Stop impersonation: restore the original admin session. */
export async function DELETE(req: Request) {
  const session = await auth();
  const impersonatorId = session?.user?.impersonatorId;
  if (!impersonatorId) {
    return NextResponse.json({ error: "Not impersonating" }, { status: 400 });
  }
  const targetId = session!.user.id;

  await updateSession({ action: "stopImpersonate" } as Parameters<typeof updateSession>[0]);

  await logAdminAction({
    actorUserId: impersonatorId,
    actorEmail: session!.user.impersonatorEmail,
    action: "stop_impersonation",
    targetUserId: targetId,
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true });
}
