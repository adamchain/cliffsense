import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Project from "@/lib/db/models/Project";
import { serializeProject } from "@/lib/projects/serialize";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

const checklistItemSchema = z.object({
  id: z.string().min(1).max(40),
  text: z.string().trim().min(1).max(500),
  done: z.boolean().default(false),
  dueAt: z.string().datetime().nullable().default(null),
});

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "done", "archived"]).optional(),
  color: z.string().trim().max(16).optional(),
  notes: z.string().max(20000).optional(),
  checklist: z.array(checklistItemSchema).max(500).optional(),
  linkedDocumentIds: z.array(objectId).max(200).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await connectDB();
  const row = await Project.findById(id).lean();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ project: serializeProject(row) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await connectDB();
  const row = await Project.findById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const d = parsed.data;
  if (d.name !== undefined) row.name = d.name;
  if (d.description !== undefined) row.description = d.description;
  if (d.status !== undefined) row.status = d.status;
  if (d.color !== undefined) row.color = d.color;
  if (d.notes !== undefined) row.notes = d.notes;
  if (d.checklist !== undefined) {
    row.set(
      "checklist",
      d.checklist.map((c) => ({
        id: c.id,
        text: c.text,
        done: c.done,
        dueAt: c.dueAt ? new Date(c.dueAt) : null,
        createdAt: new Date(),
      })),
    );
  }
  if (d.linkedDocumentIds !== undefined) {
    row.set(
      "linkedDocumentIds",
      d.linkedDocumentIds.map((x) => new mongoose.Types.ObjectId(x)),
    );
  }
  await row.save();

  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId.toString(),
    category: "beneficiary",
    action: "project.update",
    resourceType: "project",
    resourceId: id,
  });
  return NextResponse.json({ project: serializeProject(row) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await connectDB();
  const row = await Project.findById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await row.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId.toString(),
    category: "beneficiary",
    action: "project.delete",
    resourceType: "project",
    resourceId: id,
  });
  return NextResponse.json({ ok: true });
}
