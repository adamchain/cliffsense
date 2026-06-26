import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { PROGRAMS, type Program } from "@/lib/programs";
import { FORMS_CATALOG, PROGRAM_LABELS } from "@/lib/forms/catalog";
import type { CatalogForm } from "@/lib/forms/types";
import {
  IconExternalLink,
  IconFileText,
  IconMessageChatbot,
  IconWorld,
} from "@tabler/icons-react";

export const metadata = { title: "Reports & Docs · MyBenefitsPA" };

function FormRow({ form }: { form: CatalogForm }) {
  return (
    <li className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {form.formNumber ? (
            <span className="rounded bg-[var(--color-cs-surface)] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--color-cs-text-secondary)]">
              {form.formNumber}
            </span>
          ) : null}
          <span className="text-[14px] font-semibold text-[var(--color-cs-text)]">{form.title}</span>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">{form.purpose}</p>
        <p className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">
          {form.agency} · {form.frequency}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:pl-4">
        {form.fillableId ? (
          <Link
            href={`/documents/${form.fillableId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
          >
            <IconMessageChatbot size={14} stroke={1.8} aria-hidden />
            Fill out
          </Link>
        ) : null}
        <a
          href={form.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-cs-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
        >
          {form.online ? <IconWorld size={14} stroke={1.8} aria-hidden /> : <IconExternalLink size={14} stroke={1.8} aria-hidden />}
          {form.online ? "Open portal" : "Official form"}
        </a>
      </div>
    </li>
  );
}

function ProgramSection({ program, forms }: { program: Program; forms: CatalogForm[] }) {
  const reporting = forms.filter((f) => f.category === "reporting");
  const reapply = forms.filter((f) => f.category === "reapply");
  return (
    <section className="cs-card p-5">
      <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">{PROGRAM_LABELS[program]}</h2>
      <div className="mt-3 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Reporting
          </h3>
          {reporting.length > 0 ? (
            <ul className="divide-y divide-[var(--color-cs-border)]">
              {reporting.map((f) => <FormRow key={f.id} form={f} />)}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[var(--color-cs-text-muted)]">No routine reporting form.</p>
          )}
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
            Reapply / Recertification
          </h3>
          {reapply.length > 0 ? (
            <ul className="divide-y divide-[var(--color-cs-border)]">
              {reapply.map((f) => <FormRow key={f.id} form={f} />)}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[var(--color-cs-text-muted)]">No reapply form.</p>
          )}
        </div>
      </div>
    </section>
  );
}

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
  // Show enrolled programs first; if none selected yet, show all so the page is useful.
  const programs: Program[] = enrolled.length > 0 ? [...PROGRAMS].filter((p) => enrolled.includes(p)) : [...PROGRAMS];

  const byProgram = programs
    .map((p) => ({ program: p, forms: FORMS_CATALOG.filter((f) => f.program === p) }))
    .filter((g) => g.forms.length > 0);

  return (
    <>
      <div className="mb-1 text-xs font-medium text-[var(--color-cs-text-secondary)]">Home › Reports &amp; Docs</div>
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[var(--color-cs-text)]">
        <IconFileText size={24} stroke={1.7} aria-hidden />
        Reports &amp; Docs
      </h1>
      <p className="mb-5 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        The reporting and recertification forms for{" "}
        {enrolled.length > 0 ? "your enrolled programs" : "every program"}. Fill the in-app ones, pre-filled
        from your profile, then print or download — and use the official link to submit.
        Informational only; MyBenefitsPA does not determine eligibility.
      </p>

      <div className="flex flex-col gap-3">
        {byProgram.map((g) => (
          <ProgramSection key={g.program} program={g.program} forms={g.forms} />
        ))}
      </div>
    </>
  );
}
