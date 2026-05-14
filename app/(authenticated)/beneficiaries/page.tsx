import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import BankConnection from "@/lib/db/models/BankConnection";
import { NewBeneficiaryButton } from "./new-beneficiary-button";

export default async function BeneficiariesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  await connectDB();
  const list = await Beneficiary.find({ ownerUserId: session.user.id })
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

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Beneficiaries</div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Beneficiaries</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
            {supportsMultiple
              ? "Each person you support has their own bank links, programs, and alerts."
              : "Your profile is the primary beneficiary. Family, fiduciary, and nonprofit accounts can manage multiple people."}
          </p>
        </div>
        {supportsMultiple && <NewBeneficiaryButton />}
      </div>

      {list.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--color-cs-border)] bg-white p-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          No beneficiaries yet.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((b) => {
            const id = b._id.toString();
            const banks = countById.get(id) ?? 0;
            const programs = (b.benefitsEnrolled ?? []).map((e) => e.program);
            return (
              <li
                key={id}
                className="rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/beneficiaries/${id}`}
                    className="text-[15px] font-medium text-[var(--color-cs-text)] hover:underline"
                  >
                    {b.firstName} {b.lastName}
                  </Link>
                  {b.isOwner && (
                    <span className="rounded bg-[var(--color-cs-info-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-info)]">
                      You
                    </span>
                  )}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-[var(--color-cs-text-secondary)]">
                  <dt>State</dt>
                  <dd className="text-[var(--color-cs-text)]">{b.state || "—"}</dd>
                  <dt>Household</dt>
                  <dd className="text-[var(--color-cs-text)]">{b.householdSize}</dd>
                  <dt>Banks</dt>
                  <dd className="text-[var(--color-cs-text)]">{banks}</dd>
                  <dt>Programs</dt>
                  <dd className="text-[var(--color-cs-text)]">
                    {programs.length > 0 ? programs.join(", ") : "—"}
                  </dd>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
