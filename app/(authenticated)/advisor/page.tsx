import { auth } from "@/auth";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { AdvisorWorkspace } from "./advisor-workspace";

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ ask?: string }>;
}) {
  const { ask } = await searchParams;
  const initialQuestion = typeof ask === "string" ? ask.slice(0, 500) : undefined;

  const session = await auth();
  let beneficiaryId: string | null = null;
  if (session?.user?.id) {
    const primary = await getActiveBeneficiaryForUser(session.user.id);
    beneficiaryId = primary?._id.toString() ?? null;
  }

  return <AdvisorWorkspace initialQuestion={initialQuestion} beneficiaryId={beneficiaryId} />;
}
