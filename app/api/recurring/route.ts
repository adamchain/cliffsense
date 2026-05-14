import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import RecurringStream from "@/lib/db/models/RecurringStream";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const list = await RecurringStream.find({
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
  })
    .sort({ lastDate: -1, updatedAt: -1 })
    .lean();

  return NextResponse.json({ streams: list });
}
