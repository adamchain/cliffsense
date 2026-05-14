import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { ExportForm } from "./export-form";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Reports</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Exports & reports</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Generate CSV, PDF, JSON, or ZIP bundles for record-keeping or to share with your benefits
        counselor. Exports queue through the worker and land in your downloads list when ready.
      </p>

      {!beneficiaryId ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          Add a beneficiary profile first.{" "}
          <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
            Continue onboarding
          </Link>
          .
        </p>
      ) : (
        <ExportForm beneficiaryId={beneficiaryId} />
      )}
    </>
  );
}
