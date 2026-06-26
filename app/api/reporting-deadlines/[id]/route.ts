import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";

const patchSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();
  const row = await ReportingDeadline.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  row.completedAt = parsed.data.completed ? new Date() : null;
  await row.save();
  return NextResponse.json({ deadline: { _id: row._id.toString(), completedAt: row.completedAt } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  await connectDB();
  const row = await ReportingDeadline.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await row.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId,
    category: "threshold",
    action: "reporting_deadline.deleted",
    resourceType: "reporting_deadline",
    resourceId: id,
  });
  return NextResponse.json({ ok: true });
}
