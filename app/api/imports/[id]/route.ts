import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import ImportBatch from "@/lib/db/models/ImportBatch";

export const runtime = "nodejs";

/** Discard a staged import that was never committed. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid import id" }, { status: 400 });
  }

  await connectDB();
  const batch = await ImportBatch.findById(id);
  if (!batch) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, batch.beneficiaryId.toString());
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (batch.status === "committed") {
    return NextResponse.json({ error: "Cannot discard a committed import" }, { status: 409 });
  }

  // Drop the staged rows; keep the batch record for the audit trail.
  batch.set("rows", []);
  batch.status = "discarded";
  await batch.save();

  return NextResponse.json({ ok: true });
}
