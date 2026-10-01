import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import VaultDocument from "@/lib/db/models/Document";
import {
  VAULT_FOLDERS,
  effectiveVaultSlot,
  folderIdForDocument,
  slotAttention,
  vaultCaseContext,
} from "@/lib/vault/categories";
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
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  let folders: {
    id: string;
    label: string;
    hint: string;
    tint: string;
    slots: { id: string; label: string; hint: string; attention: "needed" | "review" | "optional" | "keep" }[];
    docs: { id: string; filename: string; sizeLabel: string; uploadedLabel: string; slotId: string | null }[];
  }[] = [];
  let proofFiled = 0;
  let proofNeeded = 0;
  let screened = false;

  if (beneficiaryId) {
    await connectDB();
    const [rows, ben] = await Promise.all([
      VaultDocument.find({ beneficiaryId })
        .select("filename mimeType sizeBytes category slot createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Beneficiary.findById(beneficiaryId).select("opening benefitsEnrolled").lean(),
    ]);

    const opening = (ben?.opening ?? null) as {
      benefitScreening?: Record<string, string>;
      authorities?: string[];
    } | null;
    const enrolled = (ben?.benefitsEnrolled ?? []) as {
      program?: string;
      contextData?: { workersWithJobSuccess?: boolean };
    }[];
    const ctx = vaultCaseContext({
      screening: opening?.benefitScreening,
      enrolled: enrolled.map((row) => String(row.program ?? "")).filter(Boolean),
      authorities: opening?.authorities,
      extraActive: enrolled.some((row) => row.contextData?.workersWithJobSuccess) ? ["wjs"] : [],
    });
    screened = ctx.active.size > 0 || ctx.review.size > 0;

    const docsByFolder = new Map<string, (typeof folders)[number]["docs"]>();
    for (const row of rows) {
      const slotId = effectiveVaultSlot(row.category, row.slot);
      const folderId = folderIdForDocument(row.category, row.slot);
      const list = docsByFolder.get(folderId) ?? [];
      list.push({
        id: row._id.toString(),
        filename: row.filename,
        sizeLabel: formatSize(row.sizeBytes),
        uploadedLabel: new Date(row.createdAt).toLocaleDateString(),
        slotId,
      });
      docsByFolder.set(folderId, list);
    }

    folders = VAULT_FOLDERS.map((folder) => {
      const docs = docsByFolder.get(folder.id) ?? [];
      const slots = folder.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        hint: slot.hint,
        attention: slotAttention(slot, ctx),
      }));
      for (const slot of slots) {
        if (slot.attention !== "needed") continue;
        proofNeeded += 1;
        if (docs.some((doc) => doc.slotId === slot.id)) proofFiled += 1;
      }
      return {
        id: folder.id,
        label: folder.label,
        hint: folder.hint,
        tint: folder.tint,
        slots,
        docs,
      };
    });
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Vault</div>
      <h1 className="cs-big-title mb-2">Vault</h1>
      <p className="mb-2 max-w-2xl text-[13.5px] text-[var(--color-cs-text-secondary)]">
        Preset folders for the opening file: identity and authority, each benefit, income and
        resources, trusts and ABLE, and the notice trail. Add a file on the row it belongs to.
      </p>
      <p className="mb-4 max-w-2xl text-[12.5px] text-[var(--color-cs-text-secondary)]">
        Keep passwords, login codes, and full Social Security or account numbers out of these files.
        Max 10 MB each.
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
          {!screened && (
            <p className="mb-3 text-[13px] text-[var(--color-cs-text-secondary)]">
              <Link href="/onboarding/benefits" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
                Screen benefits
              </Link>{" "}
              and{" "}
              <Link href="/onboarding/authority" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
                record authority
              </Link>{" "}
              so empty rows show up only for this case.
            </p>
          )}
          <VaultBrowser
            beneficiaryId={beneficiaryId}
            folders={folders}
            proofFiled={proofFiled}
            proofNeeded={proofNeeded}
            screened={screened}
          />
        </>
      )}
    </>
  );
}
