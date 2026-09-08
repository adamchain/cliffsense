import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { BenefitDetailView } from "@/components/thresholds/benefit-detail-view";
import { programCodeKey, programMetaFor } from "@/lib/benefits/program-meta";

export default async function BenefitDetailPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const { program } = await params;
  const code = programCodeKey(program);
  if (!programMetaFor(code)) {
    notFound();
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return <BenefitDetailView beneficiaryId={beneficiaryId} program={code} />;
}
