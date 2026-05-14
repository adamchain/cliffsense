import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { ThresholdsView } from "@/components/thresholds/thresholds-view";

export default async function ThresholdsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return <ThresholdsView beneficiaryId={beneficiaryId} />;
}
