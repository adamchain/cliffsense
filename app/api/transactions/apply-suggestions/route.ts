import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import { reapplyAutoCategoriesForBeneficiary } from "@/lib/transactions/reapply-auto-categories";

const bodySchema = z.object({ beneficiaryId: z.string().min(1) }).strict();

/**
 * Bulk-apply category heuristics to unedited unclear / mis-tagged rows.
 * Does not set `lastUserEditedAt` (user can still override via PATCH).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { beneficiaryId } = parsed.data;
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const result = await reapplyAutoCategoriesForBeneficiary(
    new mongoose.Types.ObjectId(beneficiaryId),
  );

  return NextResponse.json(result);
}
