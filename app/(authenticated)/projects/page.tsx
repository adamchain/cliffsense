import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { getBeneficiaryAccessRole } from "@/lib/beneficiaries/access";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  let canWrite = false;
  if (beneficiaryId) {
    const role = await getBeneficiaryAccessRole(session.user.id, beneficiaryId);
    canWrite = role === "owner" || role === "co_manager";
  }

  return <ProjectsView beneficiaryId={beneficiaryId} canWrite={canWrite} />;
}
