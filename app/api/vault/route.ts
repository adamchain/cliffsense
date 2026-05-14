import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";

export const runtime = "nodejs";

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
  const rows = await VaultDocument.find({ beneficiaryId })
    .select("filename mimeType sizeBytes category scanStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    documents: rows.map((r) => ({
      id: r._id.toString(),
      filename: r.filename,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      category: r.category,
      scanStatus: r.scanStatus,
      createdAt: r.createdAt,
    })),
  });
}
