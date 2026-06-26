import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import PushSubscription from "@/lib/db/models/PushSubscription";

const schema = z.object({ endpoint: z.string().url() });

/** Removes a device's Web Push subscription (on disable / sign-out). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();
  await PushSubscription.deleteOne({ endpoint: parsed.data.endpoint, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
