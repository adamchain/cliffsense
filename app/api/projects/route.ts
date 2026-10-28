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

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId") ?? "";
  if (!objectId.safeParse(beneficiaryId).success) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = searchParams.get("status");
  await connectDB();
  const filter: Record<string, unknown> = {
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
  };
  if (status && ["active", "done", "archived"].includes(status)) {
    filter.status = status;
  }
  const rows = await Project.find(filter).sort({ status: 1, updatedAt: -1 }).limit(200).lean();
  return NextResponse.json({ projects: rows.map((r) => serializeProject(r)) });
}

const createSchema = z.object({
  beneficiaryId: objectId,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  color: z.string().trim().max(16).default("#3b82c4"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give the project a name." }, { status: 400 });
  }
  const data = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, data.beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const doc = await Project.create({
    beneficiaryId: new mongoose.Types.ObjectId(data.beneficiaryId),
    createdByUserId: new mongoose.Types.ObjectId(session.user.id),
    name: data.name,
    description: data.description,
    color: data.color,
  });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: data.beneficiaryId,
    category: "beneficiary",
    action: "project.create",
    resourceType: "project",
    resourceId: doc._id.toString(),
  });
  return NextResponse.json({ project: serializeProject(doc) });
}
