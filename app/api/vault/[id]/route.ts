import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

async function loadOwned(id: string, userId: string) {
  await connectDB();
  const doc = await VaultDocument.findById(id);
  if (!doc) return null;
  const owned = await Beneficiary.findOne({
    _id: doc.beneficiaryId,
    ownerUserId: userId,
  }).select("_id");
  if (!owned) return null;
  return doc;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const doc = await loadOwned(id, session.user.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  if (!download) {
    return NextResponse.json({
      document: {
        id: doc._id.toString(),
        beneficiaryId: doc.beneficiaryId.toString(),
        filename: doc.filename,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        category: doc.category,
        scanStatus: doc.scanStatus,
        createdAt: doc.createdAt,
      },
    });
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId: doc.beneficiaryId,
    category: "vault",
    action: "vault.downloaded",
    resourceType: "document",
    resourceId: doc._id.toString(),
  });

  const body = new Uint8Array(doc.content);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": doc.mimeType || "application/octet-stream",
      "content-length": String(doc.sizeBytes),
      "content-disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
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
  const doc = await loadOwned(id, session.user.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await VaultDocument.deleteOne({ _id: doc._id });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: doc.beneficiaryId,
    category: "vault",
    action: "vault.deleted",
    resourceType: "document",
    resourceId: doc._id.toString(),
    details: { filename: doc.filename },
  });
  return NextResponse.json({ ok: true });
}
