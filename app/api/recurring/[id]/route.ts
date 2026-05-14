import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import RecurringStream from "@/lib/db/models/RecurringStream";

const patchSchema = z
  .object({
    userCategory: z
      .enum(["earned_income", "benefit_deposit", "other_income", "subscription", "rent", "other"])
      .optional(),
    isConfirmed: z.boolean().optional(),
    excludedFromThresholds: z.boolean().optional(),
    excludeReason: z.string().max(500).optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.userCategory !== undefined ||
      d.isConfirmed !== undefined ||
      d.excludedFromThresholds !== undefined ||
      d.excludeReason !== undefined,
    { message: "No changes" },
  );

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
  const stream = await RecurringStream.findById(id);
  if (!stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, stream.beneficiaryId.toString());
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prevCat = stream.userCategory;
  const prevConf = stream.isConfirmed;
  const prevExcluded = Boolean(stream.excludedFromThresholds);

  if (parsed.data.userCategory !== undefined) {
    stream.userCategory = parsed.data.userCategory;
  }
  if (parsed.data.isConfirmed !== undefined) {
    stream.isConfirmed = parsed.data.isConfirmed;
  }
  if (parsed.data.excludedFromThresholds !== undefined) {
    stream.excludedFromThresholds = parsed.data.excludedFromThresholds;
    if (!parsed.data.excludedFromThresholds) {
      stream.excludeReason = "";
    }
  }
  if (parsed.data.excludeReason !== undefined) {
    stream.excludeReason = parsed.data.excludeReason;
  }
  await stream.save();

  if (parsed.data.userCategory !== undefined && parsed.data.userCategory !== prevCat) {
    await logActivity({
      userId: session.user.id,
      beneficiaryId: stream.beneficiaryId,
      category: "recurring",
      action: "recurring.recategorized",
      resourceType: "recurringStream",
      resourceId: stream._id.toString(),
      details: { from: prevCat, to: parsed.data.userCategory },
    });
  }
  if (parsed.data.isConfirmed === true && !prevConf) {
    await logActivity({
      userId: session.user.id,
      beneficiaryId: stream.beneficiaryId,
      category: "recurring",
      action: "recurring.confirmed",
      resourceType: "recurringStream",
      resourceId: stream._id.toString(),
    });
  }
  if (
    parsed.data.excludedFromThresholds !== undefined &&
    parsed.data.excludedFromThresholds !== prevExcluded
  ) {
    await logActivity({
      userId: session.user.id,
      beneficiaryId: stream.beneficiaryId,
      category: "recurring",
      action: parsed.data.excludedFromThresholds ? "recurring.excluded" : "recurring.included",
      resourceType: "recurringStream",
      resourceId: stream._id.toString(),
      details: { excluded: parsed.data.excludedFromThresholds },
    });
  }

  return NextResponse.json({ stream });
}
