import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";
import Transaction from "@/lib/db/models/Transaction";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_CATEGORIES = new Set([
  "receipts",
  "award_letter",
  "income_verification",
  "renewal",
  "asset_statement",
  "correspondence",
  "other",
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  const beneficiaryId = form.get("beneficiaryId");
  const category = form.get("category");
  const file = form.get("file");
  const transactionId = form.get("transactionId");

  if (typeof beneficiaryId !== "string" || !beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
      { status: 413 },
    );
  }
  const cat = typeof category === "string" && ALLOWED_CATEGORIES.has(category) ? category : "other";

  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  // When pairing a receipt to a transaction, confirm the transaction belongs to
  // this beneficiary before linking either direction.
  let linkedTxId: string | null = null;
  if (cat === "receipts" && typeof transactionId === "string" && transactionId) {
    const tx = await Transaction.findOne({ _id: transactionId, beneficiaryId }).select({ _id: 1 }).lean();
    if (tx) linkedTxId = String(tx._id);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const doc = await VaultDocument.create({
    beneficiaryId,
    userId: session.user.id,
    category: cat,
    transactionId: linkedTxId,
    filename: file.name || "upload",
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buf.length,
    content: buf,
    scanStatus: "clean",
  });

  if (linkedTxId) {
    await Transaction.updateOne({ _id: linkedTxId }, { $set: { receiptDocumentId: doc._id } });
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "vault",
    action: "vault.uploaded",
    resourceType: "document",
    resourceId: doc._id.toString(),
    details: { filename: doc.filename, category: cat, sizeBytes: buf.length },
  });

  return NextResponse.json({
    document: {
      id: doc._id.toString(),
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      category: doc.category,
    },
  });
}
