import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import WorkRequirementRecord from "@/lib/db/models/WorkRequirementRecord";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

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
  const rows = await WorkRequirementRecord.find({ beneficiaryId }).sort({ month: -1 }).lean();
  return NextResponse.json({
    records: rows.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })),
  });
}

/** Create-or-update the record for a given beneficiary + month (one per month). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { beneficiaryId, month, ...fields } = body as { beneficiaryId?: string; month?: string };
  if (!beneficiaryId || typeof beneficiaryId !== "string") {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  if (!month || !MONTH_RE.test(month)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const record = await WorkRequirementRecord.findOneAndUpdate(
    { beneficiaryId, month },
    { $set: { ...fields, beneficiaryId, month, userId: session.user.id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "vault",
    action: "work_requirement.saved",
    resourceType: "work_requirement_record",
    resourceId: record._id.toString(),
    details: { month },
  });

  return NextResponse.json({ record: { ...record.toObject(), id: record._id.toString(), _id: undefined } });
}
