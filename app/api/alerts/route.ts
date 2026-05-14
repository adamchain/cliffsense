import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  const status = searchParams.get("status");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const filter: Record<string, unknown> = {
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
  };
  if (status && ["new", "acknowledged", "resolved", "dismissed"].includes(status)) {
    filter.status = status;
  }

  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ alerts });
}
