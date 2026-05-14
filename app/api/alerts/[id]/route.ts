import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";

const patchSchema = z.object({
  status: z.enum(["acknowledged", "dismissed", "resolved"]),
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
  const alert = await Alert.findById(id);
  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const bid = alert.beneficiaryId.toString();
  const ok = await assertBeneficiaryAccess(session.user.id, bid);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  alert.status = parsed.data.status;
  if (parsed.data.status === "acknowledged") {
    alert.acknowledgedAt = new Date();
  }
  await alert.save();

  const action =
    parsed.data.status === "acknowledged"
      ? "alert.acknowledged"
      : parsed.data.status === "dismissed"
        ? "alert.dismissed"
        : "alert.acknowledged";

  await logActivity({
    userId: session.user.id,
    beneficiaryId: alert.beneficiaryId,
    category: "alert",
    action,
    resourceType: "alert",
    resourceId: alert._id.toString(),
    details: { status: parsed.data.status },
  });

  return NextResponse.json({ alert });
}
