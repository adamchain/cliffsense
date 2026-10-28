import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import AdvisorConversation from "@/lib/db/models/AdvisorConversation";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

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
  const convo = await AdvisorConversation.findOne({ _id: id, userId: session.user.id }).lean();
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    conversation: {
      id: convo._id.toString(),
      title: convo.title ?? "New chat",
      beneficiaryId: convo.beneficiaryId ? convo.beneficiaryId.toString() : null,
      messages: (Array.isArray(convo.messages) ? convo.messages : []).map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
      })),
    },
  });
}

const patchSchema = z.object({ title: z.string().trim().min(1).max(200) });

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
  const convo = await AdvisorConversation.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { title: parsed.data.title } },
    { new: true },
  )
    .select("title")
    .lean();
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id, title: convo.title });
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
  const res = await AdvisorConversation.deleteOne({ _id: id, userId: session.user.id });
  if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
