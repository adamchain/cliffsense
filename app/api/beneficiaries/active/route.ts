import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { ACTIVE_BENEFICIARY_COOKIE } from "@/lib/beneficiaries/active-cookie";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { beneficiaryId?: unknown };
  const beneficiaryId = typeof body.beneficiaryId === "string" ? body.beneficiaryId : "";
  if (!/^[a-f0-9]{24}$/i.test(beneficiaryId)) {
    return NextResponse.json({ error: "Invalid beneficiary" }, { status: 400 });
  }
  const allowed = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const store = await cookies();
  store.set(ACTIVE_BENEFICIARY_COOKIE, beneficiaryId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true });
}
