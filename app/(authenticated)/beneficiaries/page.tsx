import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import BeneficiaryAccess from "@/lib/db/models/BeneficiaryAccess";
import { NewBeneficiaryButton } from "./new-beneficiary-button";
import { BeneficiariesManager } from "@/components/beneficiaries/beneficiaries-manager";
import { toDateInputValue } from "@/lib/beneficiaries/date-input";

export default async function BeneficiariesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const { edit } = await searchParams;

  await connectDB();
  const accessRows = await BeneficiaryAccess.find({ userId: session.user.id, status: "active" })
    .select("beneficiaryId role")
    .lean();
  const roleByBen = new Map<string, string>(
    accessRows.map((r) => [String(r.beneficiaryId), r.role as string]),
  );
  const list = await Beneficiary.find({
    $or: [
      { ownerUserId: session.user.id },
      { _id: { $in: accessRows.map((r) => r.beneficiaryId) } },
    ],
  })
    .sort({ isOwner: -1, createdAt: 1 })
    .lean();

  const ids = list.map((b) => b._id);
  const connectionCounts = ids.length
    ? await BankConnection.aggregate([
        { $match: { beneficiaryId: { $in: ids } } },
        { $group: { _id: "$beneficiaryId", count: { $sum: 1 } } },
      ])
    : [];
  const countById = new Map<string, number>(
    connectionCounts.map((c: { _id: { toString: () => string }; count: number }) => [
      c._id.toString(),
      c.count,
    ]),
  );

  const accountType = session.user.accountType ?? "beneficiary";
  const supportsMultiple = accountType !== "beneficiary";

  const people = list.map((b) => {
    const id = b._id.toString();
    const isOwned = b.ownerUserId?.toString() === session.user!.id;
    const sharedRole = roleByBen.get(id);
    const canWrite = isOwned || sharedRole === "owner" || sharedRole === "co_manager";
    const roleChip = b.isOwner
      ? "You"
      : !isOwned && sharedRole === "viewer"
        ? "Viewer"
        : !isOwned && sharedRole === "co_manager"
          ? "Co-manager"
          : null;
    return {
      id,
      roleChip,
      canWrite,
      programs: (b.benefitsEnrolled ?? []).map((e) => e.program),
      banks: countById.get(id) ?? 0,
      profile: {
        firstName: b.firstName ?? "",
        lastName: b.lastName ?? "",
        dateOfBirth: toDateInputValue(b.dateOfBirth as Date | null),
        state: b.state ?? "",
        county: b.county ?? "",
        householdSize: b.householdSize ?? 1,
      },
    };
  });

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Beneficiaries</div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Beneficiaries</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
            {supportsMultiple
              ? "Edit names and household details here. Each person has their own bank links, programs, and alerts."
              : "Edit this profile's name and household details. Family, fiduciary, and nonprofit accounts can manage multiple people."}
          </p>
        </div>
        {supportsMultiple && <NewBeneficiaryButton />}
      </div>

      {people.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--color-cs-border)] bg-white p-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          No beneficiaries yet.
        </div>
      ) : (
        <BeneficiariesManager people={people} initialEditId={edit ?? null} />
      )}
    </>
  );
}
