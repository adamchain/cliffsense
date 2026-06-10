import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { logActivity } from "@/lib/activity/log-activity";

const schema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "reset", 10, 15 * 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const userId = await consumeAuthToken(parsed.data.token, "password_reset");
  if (!userId) {
    return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });
  }

  await connectDB();
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await User.updateOne({ _id: userId }, { $set: { hashedPassword } });

  await logActivity({ userId, category: "auth", action: "password.reset" });

  return NextResponse.json({ ok: true });
}
