import { auth } from "@/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";

const bodySchema = z.object({
  beneficiaryId: z.string().min(1),
  systemKey: z.string().min(1),
  attached: z.boolean(),
});

/** Attach/detach a bundled system threshold for a beneficiary. */
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
  const { beneficiaryId, systemKey, attached } = parsed.data;

  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  // Detached => add the key to the opt-out list; attached => remove it.
  const update = attached
    ? { $pull: { detachedThresholdKeys: systemKey } }
    : { $addToSet: { detachedThresholdKeys: systemKey } };
  await Beneficiary.updateOne({ _id: new mongoose.Types.ObjectId(beneficiaryId) }, update);

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "threshold",
    action: attached ? "threshold.attached" : "threshold.detached",
    resourceType: "threshold",
    resourceId: systemKey,
  });

  return NextResponse.json({ ok: true });
}
