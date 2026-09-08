import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { PROGRAMS, isMedicaidFamilyProgram, type Program } from "@/lib/programs";
import { FORMS_CATALOG, PROGRAM_LABELS } from "@/lib/forms/catalog";
import { FormsBrowser } from "./forms-browser";

export const metadata = { title: "Forms · MyBenefitsPA" };

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();
  const active = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiary = active
    ? await Beneficiary.findById(active._id).select({ benefitsEnrolled: 1 }).lean()
    : await Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
        .select({ benefitsEnrolled: 1 })
        .lean();

  const enrolled = (beneficiary?.benefitsEnrolled ?? [])
    .map((b) => b.program as Program)
    .filter(Boolean);
  const programs: Program[] =
    enrolled.length > 0
      ? [...PROGRAMS].filter((p) => {
          if (enrolled.includes(p)) return true;
          if (p === "MedicaidABD" && enrolled.some((e) => isMedicaidFamilyProgram(e))) return true;
          return false;
        })
      : [...PROGRAMS].filter((p) => !isMedicaidFamilyProgram(p) || p === "MedicaidABD");

  const groups = programs
    .map((p) => ({
      program: p,
      label: PROGRAM_LABELS[p],
      forms: FORMS_CATALOG.filter((f) => f.program === p),
    }))
    .filter((g) => g.forms.length > 0);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="cs-big-title">Forms</h1>
        <Link
          href="/vault"
          className="text-[15px] font-semibold text-[var(--color-cs-brand)]"
        >
          Vault
        </Link>
      </div>
      <p className="mb-4 text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Reporting and reapply forms for {enrolled.length > 0 ? "your enrolled programs" : "every program"}.
        Fill in-app, then submit via the official link.{" "}
        <Link href="/vault" className="text-[var(--color-cs-brand)]">
          Open Vault
        </Link>
      </p>

      <FormsBrowser groups={groups} />
    </div>
  );
}
