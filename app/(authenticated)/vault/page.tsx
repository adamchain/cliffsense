import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";
import { VaultUpload } from "./vault-upload";
import { VaultDocumentRow } from "./document-row";

const CATEGORIES = [
  { id: "receipts", label: "Receipts" },
  { id: "award_letter", label: "Award letters" },
  { id: "income_verification", label: "Income verification" },
  { id: "renewal", label: "Renewal & recert paperwork" },
  { id: "asset_statement", label: "Asset statements" },
  { id: "correspondence", label: "Agency correspondence" },
  { id: "other", label: "Other" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VaultPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  let docsByCategory = new Map<
    string,
    { id: string; filename: string; sizeBytes: number; createdAt: Date; mimeType: string }[]
  >();

  if (beneficiaryId) {
    await connectDB();
    const rows = await VaultDocument.find({ beneficiaryId })
      .select("filename mimeType sizeBytes category createdAt")
      .sort({ createdAt: -1 })
      .lean();
    docsByCategory = new Map();
    for (const r of rows) {
      const list = docsByCategory.get(r.category) ?? [];
      list.push({
        id: r._id.toString(),
        filename: r.filename,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
        mimeType: r.mimeType,
      });
      docsByCategory.set(r.category, list);
    }
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Vault</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">File vault</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Encrypted document storage for award letters, recert paperwork, and agency correspondence.
        Max 10 MB per file.
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
        <>
          <VaultUpload beneficiaryId={beneficiaryId} categories={CATEGORIES} />

          <section className="mt-5 rounded border border-[var(--color-cs-border)] bg-white">
            <header className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-2 text-[11px] font-medium uppercase text-[var(--color-cs-text-secondary)]">
              Documents
            </header>
            <div className="grid grid-cols-1 gap-px bg-[var(--color-cs-border)] md:grid-cols-2">
              {CATEGORIES.map((c) => {
                const docs = docsByCategory.get(c.id) ?? [];
                return (
                  <div key={c.id} className="bg-white p-4">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <h3 className="text-[13px] font-medium text-[var(--color-cs-text)]">{c.label}</h3>
                      <span className="text-[11px] text-[var(--color-cs-text-muted)]">
                        {docs.length} file{docs.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-[12px] text-[var(--color-cs-text-secondary)]">
                        No documents yet.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {docs.map((d) => (
                          <VaultDocumentRow
                            key={d.id}
                            id={d.id}
                            filename={d.filename}
                            sizeLabel={formatSize(d.sizeBytes)}
                            uploadedLabel={new Date(d.createdAt).toLocaleDateString()}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-3 text-[11px] text-[var(--color-cs-text-muted)]">
            Files are owner-scoped and only downloadable via authenticated session — no public URLs.
          </p>
        </>
      )}
    </>
  );
}
