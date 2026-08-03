import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { PROGRAMS, type Program } from "@/lib/programs";
import { FORMS_CATALOG, PROGRAM_LABELS } from "@/lib/forms/catalog";
import { FormsBrowser } from "./forms-browser";

export const metadata = { title: "Forms · MyBenefitsPA" };

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();
  const beneficiary = await Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
    .select({ benefitsEnrolled: 1 })
    .lean();

  const enrolled = (beneficiary?.benefitsEnrolled ?? [])
    .map((b) => b.program as Program)
    .filter(Boolean);
  const programs: Program[] =
    enrolled.length > 0 ? [...PROGRAMS].filter((p) => enrolled.includes(p)) : [...PROGRAMS];

  const groups = programs
    .map((p) => ({
      program: p,
      label: PROGRAM_LABELS[p],
      forms: FORMS_CATALOG.filter((f) => f.program === p),
    }))
    .filter((g) => g.forms.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
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
