import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { deleteUserAccount } from "@/lib/account/delete-account";

const schema = z.object({ confirm: z.literal("DELETE") });

/** Hard-delete the signed-in user's account and all owned data. */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  try {
    await deleteUserAccount(session.user.id);
  } catch (e) {
    console.error("account deletion failed", e);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
