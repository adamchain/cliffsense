import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import { TransactionsView } from "@/components/transactions/transactions-view";
import type { AccountConnection } from "@/components/transactions/accounts-panel";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  // Accounts now live inside Banking — load the linked connections here so the
  // embedded panel renders without a separate page.
  let connections: AccountConnection[] = [];
  if (beneficiaryId) {
    await connectDB();
    const raw = await BankConnection.find({ beneficiaryId, source: { $ne: "import" } })
      .select("institutionName status accounts lastSyncAt")
      .sort({ updatedAt: -1 })
      .lean();
    connections = raw.map((c) => ({
      id: c._id.toString(),
      institutionName: c.institutionName || "Bank",
      status: c.status,
      lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
      accounts: (c.accounts ?? []).map((a) => ({
        name: a.name,
        mask: a.mask,
        currentBalanceCents: a.currentBalanceCents,
      })),
    }));
  }

  return <TransactionsView beneficiaryId={beneficiaryId} connections={connections} />;
}
