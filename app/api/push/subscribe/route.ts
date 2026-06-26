import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import PushSubscription from "@/lib/db/models/PushSubscription";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** Saves (upserts) the caller's Web Push subscription for this device. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await connectDB();
  const { endpoint, keys } = parsed.data;
  await PushSubscription.updateOne(
    { endpoint },
    {
      $set: {
        userId: session.user.id,
        endpoint,
        keys,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? "",
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
