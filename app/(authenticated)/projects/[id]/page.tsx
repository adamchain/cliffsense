import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { getBeneficiaryAccessRole } from "@/lib/beneficiaries/access";
import { ProjectDetail } from "@/components/projects/project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const { id } = await params;
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  let canWrite = false;
  if (beneficiaryId) {
    const role = await getBeneficiaryAccessRole(session.user.id, beneficiaryId);
    canWrite = role === "owner" || role === "co_manager";
  }

  return <ProjectDetail projectId={id} canWrite={canWrite} />;
}
