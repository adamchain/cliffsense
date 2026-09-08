import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { RecurringView } from "@/components/recurring/recurring-view";

export default async function RecurringPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return <RecurringView beneficiaryId={beneficiaryId} />;
}
