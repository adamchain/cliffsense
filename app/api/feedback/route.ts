import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Feedback from "@/lib/db/models/Feedback";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  path: z.string().trim().max(300).optional().default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(req, `feedback:${session.user.id}`, 8, 60 * 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a short message." }, { status: 400 });
  }

  await connectDB();
  await Feedback.create({
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    message: parsed.data.message,
    path: parsed.data.path,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
