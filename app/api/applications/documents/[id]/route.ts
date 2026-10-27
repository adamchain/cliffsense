import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminSession } from "@/lib/admin/audit";
import { connectDB } from "@/lib/db/mongodb";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";

export const runtime = "nodejs";

/** Stream an application document — to its owner, or to any admin (for review). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const admin = await getAdminSession();
  if (!session?.user?.id && !admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await connectDB();
  const doc = await ApplicationDocument.findById(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = Boolean(session?.user?.id) && String(doc.userId) === session?.user?.id;
  if (!isOwner && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = new Uint8Array(doc.content as unknown as Buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
