import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import ImportBatch from "@/lib/db/models/ImportBatch";
import { logActivity } from "@/lib/activity/log-activity";
import { parseCsv } from "@/lib/imports/parse-csv";
import { detectMapping, normalizeRows, type ColumnMapping } from "@/lib/imports/normalize";
import { classifyRows } from "@/lib/imports/detect-duplicates";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 20000;

/**
 * Step 1 of import: upload a bank-exported CSV, parse + normalize it, run
 * duplicate detection (date + amount, in-file and against existing rows), and
 * stage the result as an ImportBatch. Nothing is written to Transactions yet —
 * the client reviews the preview and then calls /commit.
 */
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
  const file = form.get("file");
  const mappingRaw = form.get("mapping");
  const sourceLabelRaw = form.get("sourceLabel");
  // Sign hint from the UI for single-amount files: does a positive number in
  // the amount column mean money in? Ignored for split debit/credit files.
  const depositsArePositive = form.get("depositsArePositive") !== "false";

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

  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return NextResponse.json({ error: "Could not read any rows from this file" }, { status: 400 });
  }
  if (parsed.rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (${parsed.rows.length}); max ${MAX_ROWS}` },
      { status: 413 },
    );
  }

  // Column mapping: use the client's explicit mapping if supplied, else detect.
  let mapping: ColumnMapping | null = null;
  if (typeof mappingRaw === "string" && mappingRaw.trim()) {
    try {
      mapping = JSON.parse(mappingRaw) as ColumnMapping;
    } catch {
      return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
    }
  }
  if (!mapping) {
    mapping = detectMapping(parsed.headers);
    // Apply the user's sign choice to an auto-detected single-amount column.
    if (mapping && mapping.amount.kind === "single") {
      mapping.amount.depositsArePositive = depositsArePositive;
    }
  }
  if (!mapping) {
    return NextResponse.json(
      {
        error: "Could not auto-detect date and amount columns",
        needsMapping: true,
        headers: parsed.headers,
        sample: parsed.rows.slice(0, 5),
      },
      { status: 422 },
    );
  }

  const { valid, invalid } = normalizeRows(parsed.rows, parsed.rawLines, mapping);

  try {
    await connectDB();
    const benObjectId = new mongoose.Types.ObjectId(beneficiaryId);
    const classified = await classifyRows(benObjectId, valid);

  const newCount = classified.filter((r) => r.dupStatus === "new").length;
  const duplicateCount = classified.length - newCount;

  const rows = classified.map((r) => ({
    importKey: "", // assigned at commit once the batch id is known
    date: r.date,
    postedDate: r.postedDate,
    amountCents: r.amountCents,
    name: r.name,
    merchantName: r.merchantName,
    category: r.category,
    suggestedUserCategory: r.suggestedUserCategory,
    rawLine: r.rawLine,
    dupStatus: r.dupStatus,
    dupTransactionId: r.dupTransactionId
      ? new mongoose.Types.ObjectId(r.dupTransactionId)
      : null,
    // Duplicates default to skip; unique rows default to import.
    decision: r.dupStatus === "new" ? "import" : "skip",
  }));

  const sourceLabel =
    typeof sourceLabelRaw === "string" && sourceLabelRaw.trim()
      ? sourceLabelRaw.trim().slice(0, 120)
      : "Imported statements";

  const batch = await ImportBatch.create({
    beneficiaryId: benObjectId,
    userId: session.user.id,
    filename: file.name || "import.csv",
    sourceLabel,
    status: "staged",
    mapping,
    rows,
    parsedCount: parsed.rows.length,
    newCount,
    duplicateCount,
    invalidCount: invalid.length,
  });

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "transaction",
    action: "import.previewed",
    resourceType: "importBatch",
    resourceId: batch._id.toString(),
    details: {
      filename: batch.filename,
      parsed: parsed.rows.length,
      new: newCount,
      duplicates: duplicateCount,
      invalid: invalid.length,
    },
  });

  return NextResponse.json({
    batch: {
      id: batch._id.toString(),
      filename: batch.filename,
      sourceLabel: batch.sourceLabel,
      mapping,
      headers: parsed.headers,
      parsedCount: batch.parsedCount,
      newCount: batch.newCount,
      duplicateCount: batch.duplicateCount,
      invalidCount: batch.invalidCount,
      rows: batch.rows.map((r) => ({
        id: r._id.toString(),
        date: r.date,
        amountCents: r.amountCents,
        name: r.name,
        merchantName: r.merchantName,
        category: r.category,
        dupStatus: r.dupStatus,
        dupTransactionId: r.dupTransactionId ? r.dupTransactionId.toString() : null,
        decision: r.decision,
      })),
      invalid: invalid.slice(0, 50),
    },
  });
  } catch (err) {
    console.error("import preview failed", err);
    return NextResponse.json({ error: "Could not stage this import. Please try again." }, { status: 500 });
  }
}
