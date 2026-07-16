import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";

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
  const list = await BankConnection.find({ beneficiaryId, source: { $ne: "import" } })
    .select("plaidItemId plaidInstitutionId institutionName accounts status lastSyncAt createdAt")
    .lean();

  const safe = list.map((c) => ({
    id: c._id.toString(),
    plaidItemId: c.plaidItemId,
    plaidInstitutionId: c.plaidInstitutionId,
    institutionName: c.institutionName,
    accounts: c.accounts,
    status: c.status,
    lastSyncAt: c.lastSyncAt,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ connections: safe });
}
