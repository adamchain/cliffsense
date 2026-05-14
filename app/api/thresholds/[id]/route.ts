import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";

const patchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  limitCents: z.number().int().positive().optional(),
  warnAtPercent: z.number().min(0.5).max(0.99).optional(),
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
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Provide at least one field" }, { status: 400 });
  }

  await connectDB();
  const th = await Threshold.findById(id);
  if (!th || th.scope !== "user") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (th.ownerUserId?.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bid = th.beneficiaryId?.toString();
  if (!bid) {
    return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, bid);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.label !== undefined) th.label = parsed.data.label;
  if (parsed.data.description !== undefined) th.description = parsed.data.description;
  if (parsed.data.limitCents !== undefined) th.limitCents = parsed.data.limitCents;
  if (parsed.data.warnAtPercent !== undefined) th.warnAtPercent = parsed.data.warnAtPercent;
  await th.save();

  await logActivity({
    userId: session.user.id,
    beneficiaryId: new mongoose.Types.ObjectId(bid),
    category: "threshold",
    action: "threshold.updated",
    resourceType: "threshold",
    resourceId: th._id.toString(),
    details: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ threshold: th });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  await connectDB();
  const th = await Threshold.findById(id);
  if (!th || th.scope !== "user") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (th.ownerUserId?.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bid = th.beneficiaryId?.toString();
  if (!bid) {
    return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, bid);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Threshold.deleteOne({ _id: th._id });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: new mongoose.Types.ObjectId(bid),
    category: "threshold",
    action: "threshold.deleted",
    resourceType: "threshold",
    resourceId: id,
    details: { label: th.label },
  });

  return NextResponse.json({ ok: true });
}
