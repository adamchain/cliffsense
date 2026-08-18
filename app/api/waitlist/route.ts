import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import Waitlist from "@/lib/db/models/Waitlist";

const schema = z.object({
  name: z.string().min(1).max(120).trim(),
  email: z.string().email().max(254).trim(),
  notes: z.string().max(1000).trim().optional().default(""),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();
  await Waitlist.create(parsed.data);

  return NextResponse.json({ ok: true }, { status: 201 });
}
