import Link from "next/link";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { IconDownload } from "@tabler/icons-react";

const CATEGORY_LABEL: Record<string, string> = {
  award_letter: "Award letter",
  income_verification: "Income verification",
  renewal: "Renewal / recert",
  asset_statement: "Asset statement",
  correspondence: "Agency correspondence",
  other: "Other",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const { id } = await params;

  await connectDB();
  const doc = await VaultDocument.findById(id)
    .select("beneficiaryId filename mimeType sizeBytes category scanStatus createdAt")
    .lean();
  if (!doc) notFound();

  const owned = await Beneficiary.findOne({
    _id: doc.beneficiaryId,
    ownerUserId: session.user.id,
  })
    .select("firstName lastName")
    .lean();
  if (!owned) notFound();

  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        Home › <Link href="/vault" className="hover:underline">Vault</Link> ›{" "}
        <span className="truncate">{doc.filename}</span>
      </div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-medium text-[var(--color-cs-text)]">{doc.filename}</h1>
        <a
          href={`/api/vault/${doc._id.toString()}?download=1`}
          className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
        >
          <IconDownload size={14} stroke={1.5} aria-hidden />
          Download
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <section className="md:col-span-2 rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Preview</h2>
          {isImage ? (
            <img
              src={`/api/vault/${doc._id.toString()}?download=1`}
              alt={doc.filename}
              className="max-h-[60vh] w-auto rounded border border-[var(--color-cs-border)]"
            />
          ) : isPdf ? (
            <object
              data={`/api/vault/${doc._id.toString()}?download=1`}
              type="application/pdf"
              className="h-[60vh] w-full rounded border border-[var(--color-cs-border)]"
            >
              <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
                Your browser cannot inline this PDF. Use the Download button above.
              </p>
            </object>
          ) : (
            <div className="flex h-72 items-center justify-center rounded border border-dashed border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-[12px] text-[var(--color-cs-text-secondary)]">
              No inline preview for {doc.mimeType}. Use Download.
            </div>
          )}
        </section>
        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Metadata</h2>
          <dl className="space-y-1.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Beneficiary</dt>
              <dd className="truncate text-[var(--color-cs-text)]">
                {owned.firstName} {owned.lastName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Category</dt>
              <dd className="text-[var(--color-cs-text)]">
                {CATEGORY_LABEL[doc.category] ?? doc.category}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Type</dt>
              <dd className="text-[var(--color-cs-text)]">{doc.mimeType}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Size</dt>
              <dd className="tabular-nums text-[var(--color-cs-text)]">{formatSize(doc.sizeBytes)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Scan status</dt>
              <dd className="text-[var(--color-cs-text)]">{doc.scanStatus}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-cs-text-secondary)]">Uploaded</dt>
              <dd className="text-[var(--color-cs-text)]">
                {new Date(doc.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
