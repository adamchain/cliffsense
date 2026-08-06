import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import VaultDocument from "@/lib/db/models/Document";
import { VAULT_CATEGORIES, vaultSectionId } from "@/lib/vault/categories";
import { VaultUpload } from "./vault-upload";
import { VaultBrowser } from "./vault-browser";

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

  let docsBySection = new Map<
    string,
    { id: string; filename: string; sizeBytes: number; createdAt: Date; mimeType: string }[]
  >();

  if (beneficiaryId) {
    await connectDB();
    const rows = await VaultDocument.find({ beneficiaryId })
      .select("filename mimeType sizeBytes category createdAt")
      .sort({ createdAt: -1 })
      .lean();
    docsBySection = new Map();
    for (const r of rows) {
      const section = vaultSectionId(r.category);
      const list = docsBySection.get(section) ?? [];
      list.push({
        id: r._id.toString(),
        filename: r.filename,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
        mimeType: r.mimeType,
      });
      docsBySection.set(section, list);
    }
  }

  const folders = VAULT_CATEGORIES.map((c) => {
    const docs = docsBySection.get(c.id) ?? [];
    return {
      id: c.id,
      label: c.label,
      hint: c.hint,
      docs: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        sizeLabel: formatSize(d.sizeBytes),
        uploadedLabel: new Date(d.createdAt).toLocaleDateString(),
      })),
    };
  });

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Vault</div>
      <h1 className="cs-big-title mb-2">Vault</h1>
      <p className="mb-4 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Organized folders for medical records, disability proof, income, expenses, and work paperwork.
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
          <VaultUpload beneficiaryId={beneficiaryId} categories={VAULT_CATEGORIES} />

          <VaultBrowser folders={folders} />

          <p className="mt-3 text-[11px] text-[var(--color-cs-text-muted)]">
            Files are owner-scoped and only downloadable via authenticated session — no public URLs.
          </p>
        </>
      )}
    </>
  );
}
