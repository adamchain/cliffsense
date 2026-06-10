import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import { suggestUserCategoryFromPlaid } from "@/lib/transactions/suggest-user-category";

const userCategoryEnum = z.enum([
  "earned_income",
  "benefit_deposit",
  "other_income",
  "expense",
  "transfer",
  "unclear",
]);

const patchSchema = z
  .object({
    userCategory: userCategoryEnum.optional(),
    excludedFromThresholds: z.boolean().optional(),
    excludeReason: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.userCategory !== undefined ||
      d.excludedFromThresholds !== undefined ||
      d.notes !== undefined ||
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
  const tx = await Transaction.findById(id);
  if (!tx) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, tx.beneficiaryId.toString());
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prevCat = tx.userCategory;
  const prevExcluded = Boolean(tx.excludedFromThresholds);

  if (parsed.data.userCategory !== undefined) {
    tx.userCategory = parsed.data.userCategory;
  }
  if (parsed.data.excludedFromThresholds !== undefined) {
    tx.excludedFromThresholds = parsed.data.excludedFromThresholds;
    if (!parsed.data.excludedFromThresholds) {
      tx.excludeReason = "";
    }
  }
  if (parsed.data.excludeReason !== undefined) {
    tx.excludeReason = parsed.data.excludeReason;
  }
  if (parsed.data.notes !== undefined) {
    tx.notes = parsed.data.notes;
  }
  tx.lastUserEditedAt = new Date();
  await tx.save();

  if (parsed.data.userCategory !== undefined && parsed.data.userCategory !== prevCat) {
    await logActivity({
      userId: session.user.id,
      beneficiaryId: tx.beneficiaryId,
      category: "transaction",
      action: "transaction.recategorized",
      resourceType: "transaction",
      resourceId: tx._id.toString(),
      details: { from: prevCat, to: parsed.data.userCategory },
    });
  }
  if (parsed.data.excludedFromThresholds !== undefined && parsed.data.excludedFromThresholds !== prevExcluded) {
    await logActivity({
      userId: session.user.id,
      beneficiaryId: tx.beneficiaryId,
      category: "transaction",
      action: parsed.data.excludedFromThresholds ? "transaction.excluded" : "transaction.included",
      resourceType: "transaction",
      resourceId: tx._id.toString(),
      details: { excluded: parsed.data.excludedFromThresholds },
    });
  }

  const plain = tx.toObject();
  const suggestedUserCategory = suggestUserCategoryFromPlaid({
    amountCents: plain.amountCents,
    pfcPrimary: plain.pfcPrimary,
    pfcDetailed: plain.pfcDetailed,
  });
  return NextResponse.json({ transaction: { ...plain, suggestedUserCategory } });
}
