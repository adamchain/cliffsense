import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import ExportJob from "@/lib/db/models/Export";
import { generateExport } from "@/lib/exports/generate";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

const bodySchema = z.object({
  beneficiaryId: z.string().min(1),
  format: z.enum(["csv", "pdf", "json", "zip"]),
  dataset: z.enum(["transactions", "recurring", "alerts", "thresholds", "activity", "bundle"]),
  from: isoDate,
  to: isoDate,
});

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
  const rows = await ExportJob.find({ beneficiaryId })
    .select("format dataset fromDate toDate status failureReason filename sizeBytes rowCount createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({
    exports: rows.map((r) => ({
      id: r._id.toString(),
      format: r.format,
      dataset: r.dataset,
      from: r.fromDate,
      to: r.toDate,
      status: r.status,
      failureReason: r.failureReason,
      filename: r.filename,
      sizeBytes: r.sizeBytes,
      rowCount: r.rowCount,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { beneficiaryId, format, dataset, from, to } = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const job = await ExportJob.create({
    beneficiaryId,
    userId: session.user.id,
    format,
    dataset,
    fromDate: from ?? "",
    toDate: to ?? "",
    status: "queued",
  });

  try {
    const result = await generateExport({
      userId: session.user.id,
      beneficiaryId,
      format,
      dataset,
      fromDate: from ?? "",
      toDate: to ?? "",
    });
    job.status = "ready";
    job.filename = result.filename;
    job.mimeType = result.mimeType;
    job.sizeBytes = result.buffer.length;
    job.rowCount = result.rowCount;
    job.content = result.buffer;
    await job.save();

    await logActivity({
      userId: session.user.id,
      beneficiaryId,
      category: "export",
      action: "export.generated",
      resourceType: "export",
      resourceId: job._id.toString(),
      details: { format, dataset, rowCount: result.rowCount, sizeBytes: result.buffer.length },
    });
  } catch (e) {
    job.status = "failed";
    job.failureReason = e instanceof Error ? e.message : "Unknown error";
    await job.save();
    await logActivity({
      userId: session.user.id,
      beneficiaryId,
      category: "export",
      action: "export.failed",
      severity: "warning",
      details: { format, dataset, error: job.failureReason },
    });
    return NextResponse.json(
      {
        id: job._id.toString(),
        status: "failed",
        error: job.failureReason,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    id: job._id.toString(),
    status: job.status,
    filename: job.filename,
    sizeBytes: job.sizeBytes,
    rowCount: job.rowCount,
  });
}
