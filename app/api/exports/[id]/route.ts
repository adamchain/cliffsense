import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import ExportJob from "@/lib/db/models/Export";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

async function loadOwned(id: string, userId: string) {
  await connectDB();
  const job = await ExportJob.findById(id);
  if (!job) return null;
  const owned = await Beneficiary.findOne({
    _id: job.beneficiaryId,
    ownerUserId: userId,
  }).select("_id");
  if (!owned) return null;
  return job;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const job = await loadOwned(id, session.user.id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get("download") !== "1") {
    return NextResponse.json({
      export: {
        id: job._id.toString(),
        status: job.status,
        format: job.format,
        dataset: job.dataset,
        filename: job.filename,
        sizeBytes: job.sizeBytes,
        rowCount: job.rowCount,
        failureReason: job.failureReason,
      },
    });
  }
  if (job.status !== "ready" || !job.content) {
    return NextResponse.json({ error: "Export not ready" }, { status: 409 });
  }
  await logActivity({
    userId: session.user.id,
    beneficiaryId: job.beneficiaryId,
    category: "export",
    action: "export.downloaded",
    resourceType: "export",
    resourceId: job._id.toString(),
  });
  return new NextResponse(new Uint8Array(job.content), {
    status: 200,
    headers: {
      "content-type": job.mimeType || "application/octet-stream",
      "content-length": String(job.sizeBytes),
      "content-disposition": `attachment; filename="${encodeURIComponent(job.filename)}"`,
      "cache-control": "private, no-store",
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const job = await loadOwned(id, session.user.id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await ExportJob.deleteOne({ _id: job._id });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: job.beneficiaryId,
    category: "export",
    action: "export.deleted",
    resourceType: "export",
    resourceId: job._id.toString(),
  });
  return NextResponse.json({ ok: true });
}
