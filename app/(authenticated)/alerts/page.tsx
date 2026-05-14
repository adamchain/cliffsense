import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { AlertsView } from "@/components/alerts/alerts-view";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return <AlertsView beneficiaryId={beneficiaryId} />;
}
