import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";
import { writeMainAppSession } from "@/lib/admin/main-app-session";

const schema = z.object({ targetUserId: z.string().min(1) });

function sessionFields(user: {
  _id: { toString(): string };
  email: string;
  name?: string | null;
  accountType: string;
  isAdmin?: boolean | null;
  onboardingStep?: string | null;
  applicationStatus?: string | null;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? "",
    accountType: user.accountType,
    isAdmin: Boolean(user.isAdmin),
    onboardingStep: user.onboardingStep ?? "none",
    applicationStatus: user.applicationStatus ?? "approved",
  };
}

/** Open the main app as the target user. The admin cookie stays in place. */
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
  const [target, actor] = await Promise.all([
    User.findById(targetUserId)
      .select("email name accountType isAdmin onboardingStep applicationStatus status")
      .lean(),
    User.findById(session.user.id).select("email name").lean(),
  ]);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target._id.toString() === session.user.id) {
    return NextResponse.json({ error: "You cannot impersonate yourself." }, { status: 400 });
  }

  await writeMainAppSession({
    ...sessionFields(target),
    impersonatorId: session.user.id,
    impersonatorEmail: session.user.email,
    impersonatorName: actor?.name ?? "",
  });

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

/** Stop impersonation: put the main app back on the admin's own account. */
export async function DELETE(req: Request) {
  const session = await auth();
  const impersonatorId = session?.user?.impersonatorId;
  if (!impersonatorId) {
    return NextResponse.json({ error: "Not impersonating" }, { status: 400 });
  }
  const targetId = session.user.id;

  await connectDB();
  const admin = await User.findById(impersonatorId)
    .select("email name accountType isAdmin onboardingStep applicationStatus")
    .lean();
  if (!admin) {
    return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
  }

  await writeMainAppSession(sessionFields(admin));

  await logAdminAction({
    actorUserId: impersonatorId,
    actorEmail: session.user.impersonatorEmail,
    action: "stop_impersonation",
    targetUserId: targetId,
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true });
}
