import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db/mongodb";
import Application from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { ApplicationStatusBadge, ApplicationTimeline } from "@/components/applications/status-parts";
import { relationshipLabel } from "@/lib/applications/labels";

export const metadata = { title: "Application status · MyBenefitsPA" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14">
        <Image
          src="/mybenefitspa-logo.png"
          alt="MyBenefitsPA"
          width={180}
          height={142}
          priority
          className="h-8 w-auto"
        />
        {children}
      </main>
    </div>
  );
}

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connectDB();
  const app = await Application.findOne({ statusToken: token });

  if (!app) {
    return (
      <Shell>
        <div className="cs-card mt-8 p-6">
          <h1 className="text-[18px] font-bold">Status link not found</h1>
          <p className="mt-2 text-[13px] text-[var(--color-cs-text-secondary)]">
            This status link is invalid or has expired. Sign in to view your application.
          </p>
          <Link href="/auth/signin" className="cs-btn cs-btn-primary mt-4 inline-flex">
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  const docCount = await ApplicationDocument.countDocuments({ applicationId: app._id });
  const approved = app.status === "approved";

  return (
    <Shell>
      <div className="mt-8 flex items-center gap-3">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight">Application status</h1>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        {approved
          ? "Your application was approved. Sign in to finish setting up your account."
          : app.status === "rejected"
            ? "We couldn't approve your application yet. Sign in to see the reviewer's note and upload a different document."
            : "Your application is being reviewed. We'll email you when there's a decision — this page always shows the latest status."}
      </p>

      <div className="cs-card mt-6 space-y-2 p-6 text-[13px]">
        {app.actingFor?.personName ? (
          <div className="flex justify-between gap-3">
            <span className="text-[var(--color-cs-text-secondary)]">Helping</span>
            <span className="font-medium">{app.actingFor.personName}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <span className="text-[var(--color-cs-text-secondary)]">Authority</span>
          <span className="font-medium">{relationshipLabel(app.actingFor?.relationship ?? "other")}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--color-cs-text-secondary)]">Documents on file</span>
          <span className="font-medium">{docCount}</span>
        </div>
      </div>

      {app.reviewNote ? (
        <div className="cs-card mt-4 p-5 text-[13px]">
          <p className="font-semibold">Reviewer note</p>
          <p className="mt-1 text-[var(--color-cs-text-secondary)]">{app.reviewNote}</p>
        </div>
      ) : null}

      <div className="cs-card mt-4 p-6">
        <h2 className="mb-4 text-[15px] font-bold">Progress</h2>
        <ApplicationTimeline
          events={(app.timeline ?? []).map((t) => ({
            type: t.type,
            at: new Date(t.at).toISOString(),
            note: t.note ?? "",
          }))}
        />
      </div>

      <Link href="/auth/signin" className="cs-btn cs-btn-primary mt-6 inline-flex">
        {approved ? "Sign in and continue" : "Sign in to manage your application"}
      </Link>
    </Shell>
  );
}
