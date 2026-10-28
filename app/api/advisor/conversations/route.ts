import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import AdvisorConversation from "@/lib/db/models/AdvisorConversation";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/** First line of the opening question, trimmed to a tidy title. */
function deriveTitle(firstUserMessage: string): string {
  const line = firstUserMessage.trim().split(/\n/)[0] ?? "";
  const clean = line.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 60 ? `${clean.slice(0, 58)}…` : clean;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(session.user.id),
  };
  const beneficiaryId = searchParams.get("beneficiaryId");
  if (beneficiaryId && objectId.safeParse(beneficiaryId).success) {
    filter.beneficiaryId = new mongoose.Types.ObjectId(beneficiaryId);
  }

  const rows = await AdvisorConversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .select("title lastMessageAt messages")
    .lean();

  return NextResponse.json({
    conversations: rows.map((c) => {
      const msgs = Array.isArray(c.messages) ? c.messages : [];
      const last = msgs[msgs.length - 1];
      return {
        id: c._id.toString(),
        title: c.title ?? "New chat",
        lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : "",
        messageCount: msgs.length,
        preview: last ? String(last.content).slice(0, 120) : "",
      };
    }),
  });
}

const appendSchema = z.object({
  conversationId: objectId.nullable().optional(),
  beneficiaryId: objectId.nullable().optional(),
  userMessage: z.string().trim().min(1).max(8000),
  assistantMessage: z.string().trim().min(1).max(8000),
});

/** Append one completed turn (user + assistant). Creates the thread if needed. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = appendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { conversationId, beneficiaryId, userMessage, assistantMessage } = parsed.data;

  await connectDB();
  const now = new Date();
  const turn = [
    { role: "user" as const, content: userMessage, createdAt: now },
    { role: "assistant" as const, content: assistantMessage, createdAt: now },
  ];

  if (conversationId) {
    const convo = await AdvisorConversation.findOne({
      _id: conversationId,
      userId: session.user.id,
    });
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    convo.messages.push(...turn);
    convo.lastMessageAt = now;
    await convo.save();
    return NextResponse.json({ id: convo._id.toString(), title: convo.title });
  }

  const title = deriveTitle(userMessage);
  const convo = await AdvisorConversation.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    beneficiaryId:
      beneficiaryId && objectId.safeParse(beneficiaryId).success
        ? new mongoose.Types.ObjectId(beneficiaryId)
        : null,
    title,
    messages: turn,
    lastMessageAt: now,
  });
  return NextResponse.json({ id: convo._id.toString(), title });
}
