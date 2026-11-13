import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { programLabel } from "@/lib/benefits/program-meta";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { listVisibleBankConnections } from "@/lib/banks/linked-connections";
import { TransactionsView } from "@/components/transactions/transactions-view";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  // Accounts now live inside Banking — load the linked connections here so the
  // embedded panel renders without a separate page.
  let connections: Awaited<ReturnType<typeof listVisibleBankConnections>> = [];
  let programs: { code: string; label: string }[] = [];
  if (beneficiaryId) {
    await connectDB();
    const [linked, beneficiary] = await Promise.all([
      listVisibleBankConnections(beneficiaryId),
      Beneficiary.findById(beneficiaryId).select("benefitsEnrolled").lean(),
    ]);
    connections = linked;
    programs = (beneficiary?.benefitsEnrolled ?? [])
      .map((row) => String(row.program ?? "").trim())
      .filter(Boolean)
      .map((code) => ({ code, label: programLabel(code) }));
  }

  return <TransactionsView beneficiaryId={beneficiaryId} connections={connections} programs={programs} />;
}
