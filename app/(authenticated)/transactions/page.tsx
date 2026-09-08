import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { connectDB } from "@/lib/db/mongodb";
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
  if (beneficiaryId) {
    await connectDB();
    connections = await listVisibleBankConnections(beneficiaryId);
  }

  return <TransactionsView beneficiaryId={beneficiaryId} connections={connections} />;
}
