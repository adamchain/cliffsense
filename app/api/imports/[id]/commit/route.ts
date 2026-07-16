import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import type { UpdateFilter } from "mongodb";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import ImportBatch from "@/lib/db/models/ImportBatch";
import Transaction, { type TransactionDoc } from "@/lib/db/models/Transaction";
import { logActivity } from "@/lib/activity/log-activity";
import { getOrCreateImportConnection, makeImportKey } from "@/lib/imports/import-source";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";
import { sendAlertEmailsForNewAlerts } from "@/lib/email/dispatch-alerts";
import { sendAlertPushForNewAlerts } from "@/lib/push/dispatch-push";

export const runtime = "nodejs";

// Optional per-row overrides of the staged decision, keyed by row id.
const bodySchema = z
  .object({
    decisions: z.record(z.string(), z.enum(["import", "skip"])).optional(),
  })
  .strict()
  .default({});

/**
 * Step 2 of import: apply the (possibly user-adjusted) per-row decisions from a
 * staged ImportBatch, upsert the chosen rows as Transactions under the
 * synthetic "Imported statements" connection, then run the same threshold
 * evaluation + alert dispatch a Plaid sync would. Idempotent: re-committing the
 * same batch upserts on the stable import key rather than duplicating.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid import id" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const overrides = parsed.data.decisions ?? {};

  await connectDB();
  const batch = await ImportBatch.findById(id);
  if (!batch) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }
  const beneficiaryId = batch.beneficiaryId.toString();
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (batch.status === "committed") {
    return NextResponse.json({ error: "This import was already committed" }, { status: 409 });
  }
  if (batch.status === "discarded") {
    return NextResponse.json({ error: "This import was discarded" }, { status: 409 });
  }

  const benObjectId = batch.beneficiaryId as mongoose.Types.ObjectId;
  const connectionId = await getOrCreateImportConnection(benObjectId);

  // Resolve final decisions and build upsert ops for rows marked "import".
  const ops: Parameters<typeof Transaction.bulkWrite>[0] = [];
  let skipped = 0;
  for (const row of batch.rows) {
    const rowId = row._id.toString();
    const decision = overrides[rowId] ?? row.decision;
    if (decision === "skip") {
      skipped++;
      continue;
    }

    const importKey = makeImportKey(batch._id.toString(), {
      date: row.date,
      postedDate: row.postedDate,
      amountCents: row.amountCents,
      name: row.name,
      merchantName: row.merchantName,
      category: row.category,
      suggestedUserCategory: row.suggestedUserCategory,
      rawLine: row.rawLine,
    });

    const doc = {
      beneficiaryId: benObjectId,
      bankConnectionId: connectionId,
      source: "import",
      importBatchId: batch._id,
      plaidTransactionId: importKey,
      date: row.date,
      postedDate: row.postedDate || row.date,
      amountCents: row.amountCents,
      currency: "USD",
      name: row.name,
      merchantName: row.merchantName,
      category: row.category,
      plaidCategory: "",
      pfcPrimary: "",
      pfcDetailed: "",
      pending: false,
    };

    const setOnInsert: NonNullable<UpdateFilter<TransactionDoc>["$setOnInsert"]> = {
      userCategory: (row.suggestedUserCategory ||
        "unclear") as TransactionDoc["userCategory"],
      excludedFromThresholds: false,
      excludeReason: "",
      notes: "",
      recurringStreamId: null,
      appliedRuleId: null,
      lastUserEditedAt: null,
    };

    ops.push({
      updateOne: {
        filter: { beneficiaryId: benObjectId, plaidTransactionId: importKey },
        update: { $set: doc, $setOnInsert: setOnInsert },
        upsert: true,
      },
    });
    row.importKey = importKey;
    row.decision = "import";
  }

  if (ops.length > 0) {
    await Transaction.bulkWrite(ops, { ordered: false });
  }

  batch.status = "committed";
  batch.importedCount = ops.length;
  batch.skippedCount = skipped;
  batch.committedAt = new Date();
  await batch.save();

  // Same downstream pipeline as a Plaid sync so limits/alerts stay consistent.
  const evalResult = await evaluateThresholdsForBeneficiary({
    beneficiaryId: benObjectId,
    actorUserId: session.user.id,
  });
  const newAlertIds = evalResult.alertIdsCreated.map((a) => a.toString());
  await sendAlertEmailsForNewAlerts(newAlertIds);
  await sendAlertPushForNewAlerts(newAlertIds);

  await logActivity({
    userId: session.user.id,
    beneficiaryId,
    category: "transaction",
    action: "import.committed",
    resourceType: "importBatch",
    resourceId: batch._id.toString(),
    details: {
      filename: batch.filename,
      imported: ops.length,
      skipped,
      alertsCreated: evalResult.alertsCreated,
    },
  });

  return NextResponse.json({
    ok: true,
    imported: ops.length,
    skipped,
    alertsCreated: evalResult.alertsCreated,
  });
}
