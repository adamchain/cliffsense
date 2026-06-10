import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { acceptInvite } from "@/lib/beneficiaries/invites";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await acceptInvite({
    token: parsed.data.token,
    userId: session.user.id,
    userEmail: session.user.email,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, beneficiaryId: result.beneficiaryId });
}
