"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { ACTIVE_BENEFICIARY_COOKIE } from "@/lib/beneficiaries/active";

export async function setActiveBeneficiary(
  beneficiaryId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (!/^[a-f0-9]{24}$/i.test(beneficiaryId)) {
    return { error: "Invalid beneficiary" };
  }
  const allowed = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return { error: "Forbidden" };
  }
  const store = await cookies();
  store.set(ACTIVE_BENEFICIARY_COOKIE, beneficiaryId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
