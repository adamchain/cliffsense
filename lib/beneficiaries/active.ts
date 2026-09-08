import { cookies } from "next/headers";
import {
  listAccessibleBeneficiariesForUser,
  type AccessibleBeneficiary,
} from "@/lib/beneficiaries/access";
import { resolveActiveBeneficiaryId } from "@/lib/beneficiaries/resolve-active";

export const ACTIVE_BENEFICIARY_COOKIE = "mbpa_active_beneficiary";
export { resolveActiveBeneficiaryId };

async function readRequestedBeneficiaryId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ACTIVE_BENEFICIARY_COOKIE)?.value?.trim();
  return value && /^[a-f0-9]{24}$/i.test(value) ? value : null;
}

export async function loadActiveBeneficiaryContext(userId: string): Promise<{
  accounts: AccessibleBeneficiary[];
  active: AccessibleBeneficiary | null;
}> {
  const accounts = await listAccessibleBeneficiariesForUser(userId);
  const requested = await readRequestedBeneficiaryId();
  const ids = accounts.map((a) => a._id.toString());
  const primaryId = accounts.find((a) => a.isOwner)?._id.toString() ?? ids[0] ?? null;
  const activeId = resolveActiveBeneficiaryId(requested, ids, primaryId);
  const active = accounts.find((a) => a._id.toString() === activeId) ?? null;
  return { accounts, active };
}

export async function getActiveBeneficiaryForUser(
  userId: string,
): Promise<{ _id: AccessibleBeneficiary["_id"] } | null> {
  const { active } = await loadActiveBeneficiaryContext(userId);
  return active ? { _id: active._id } : null;
}
