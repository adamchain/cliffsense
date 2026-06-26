import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { getFillableForm, initialValues } from "@/lib/forms/fillable";
import { buildPrefill } from "@/lib/forms/prefill";
import { FillableForm } from "./fillable-form";
import { IconArrowLeft } from "@tabler/icons-react";

export default async function FillableFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const { formId } = await params;
  const form = getFillableForm(formId);
  if (!form) {
    notFound();
  }

  await connectDB();
  const beneficiary = await Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
    .select({ firstName: 1, lastName: 1, dateOfBirth: 1, state: 1, county: 1, householdSize: 1 })
    .lean();

  const prefill = buildPrefill(beneficiary ?? null, {
    name: session.user.name,
    email: session.user.email,
  });
  const initial = initialValues(form, prefill);

  return (
    <>
      <div className="print:hidden">
        <Link
          href="/documents"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-cs-brand)] hover:underline"
        >
          <IconArrowLeft size={16} stroke={2} aria-hidden />
          Reports &amp; Docs
        </Link>
      </div>
      <FillableForm form={form} initialValues={initial} />
    </>
  );
}
