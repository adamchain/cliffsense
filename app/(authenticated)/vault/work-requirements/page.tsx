import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import Beneficiary from "@/lib/db/models/Beneficiary";
import WorkRequirementRecord from "@/lib/db/models/WorkRequirementRecord";
import { WorkRequirementForm } from "./work-requirement-form";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function WorkRequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  if (!beneficiaryId) {
    return (
      <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile first.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Continue onboarding
        </Link>
        .
      </p>
    );
  }

  await connectDB();
  const [beneficiary, existing] = await Promise.all([
    Beneficiary.findById(beneficiaryId).select("firstName lastName benefitsEnrolled").lean(),
    WorkRequirementRecord.find({ beneficiaryId }).sort({ month: -1 }).lean(),
  ]);

  const { month: monthParam } = await searchParams;
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : currentMonth();
  const activeRecord = existing.find((r) => r.month === month) ?? null;
  const medicaid = beneficiary?.benefitsEnrolled?.find((b) => b.program === "Medicaid");

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        Home › <Link href="/vault" className="hover:underline">Vault</Link> › Work requirements
      </div>
      <h1 className="cs-big-title mb-2">2027 Medicaid work / exemption — monthly record</h1>
      <p className="mb-4 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Keep one record per month with the supporting proof saved alongside it. This is a
        MyBenefitsPA record, not an official PA DHS form — PA DHS reports compliance or an
        exemption at application and renewal, or when DHS asks for it. Follow every DHS notice.
      </p>

      {existing.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {existing.map((r) => (
            <Link
              key={r.month}
              href={`/vault/work-requirements?month=${r.month}`}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                r.month === month
                  ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]"
                  : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)] hover:border-[var(--color-cs-brand)]"
              }`}
            >
              {monthLabel(r.month)}
            </Link>
          ))}
          {!existing.some((r) => r.month === currentMonth()) && (
            <Link
              href={`/vault/work-requirements?month=${currentMonth()}`}
              className="rounded-full border border-dashed border-[var(--color-cs-border)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--color-cs-text-secondary)] hover:border-[var(--color-cs-brand)]"
            >
              + {monthLabel(currentMonth())}
            </Link>
          )}
        </div>
      )}

      <WorkRequirementForm
        key={month}
        beneficiaryId={beneficiaryId}
        month={month}
        monthLabel={monthLabel(month)}
        beneficiaryName={beneficiary ? `${beneficiary.firstName} ${beneficiary.lastName}` : ""}
        defaultNextRenewalDate={
          medicaid?.nextRenewalDate ? new Date(medicaid.nextRenewalDate).toISOString().slice(0, 10) : ""
        }
        record={activeRecord ? JSON.parse(JSON.stringify(activeRecord)) : null}
      />
    </>
  );
}
