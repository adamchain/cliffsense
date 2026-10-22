import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { getBeneficiaryAccessRole } from "@/lib/beneficiaries/access";
import { SNT_LIMITS, SNT_SUMMARY, SNT_WORKFLOW } from "@/components/landing/claims";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import VaultDocument from "@/lib/db/models/Document";
import SntDisbursement from "@/lib/db/models/SntDisbursement";
import { emptySntProfile, serializeSntDisbursement, serializeSntProfile } from "@/lib/snt/serialize";
import type { SntDisbursementView, SntProfileView } from "@/lib/snt/record";
import {
  VAULT_FOLDERS,
  effectiveVaultSlot,
  folderIdForDocument,
  slotAttention,
  vaultCaseContext,
} from "@/lib/vault/categories";
import { bufferFromStored, docxPlainText, isDocxFile } from "@/lib/vault/docx-preview";
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
    docs: {
      id: string;
      filename: string;
      sizeLabel: string;
      uploadedLabel: string;
      slotId: string | null;
      kind: "docx" | "file";
      preview: string | null;
    }[];
  }[] = [];
  let proofFiled = 0;
  let proofNeeded = 0;
  let screened = false;
  let canWrite = false;
  let sntProfile: SntProfileView = emptySntProfile();
  let sntDisbursements: SntDisbursementView[] = [];

  if (beneficiaryId) {
    await connectDB();
    const [rows, ben, disbursementRows, role] = await Promise.all([
      VaultDocument.find({ beneficiaryId })
        .select("filename mimeType sizeBytes category slot createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Beneficiary.findById(beneficiaryId).select("opening benefitsEnrolled sntProfile").lean(),
      SntDisbursement.find({ beneficiaryId }).sort({ paymentDate: -1, createdAt: -1 }).lean(),
      getBeneficiaryAccessRole(session.user.id, beneficiaryId),
    ]);
    canWrite = role === "owner" || role === "co_manager";
    sntProfile = serializeSntProfile(ben?.sntProfile);
    sntDisbursements = disbursementRows.map((row) => serializeSntDisbursement(row));

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

    const docxIds = rows.filter((row) => isDocxFile(row.filename, row.mimeType)).map((row) => row._id);
    const previewById = new Map<string, string>();
    if (docxIds.length > 0) {
      const bodies = await VaultDocument.find({ _id: { $in: docxIds } })
        .select("content")
        .lean();
      for (const body of bodies) {
        const raw = body.content;
        if (!raw) continue;
        const buf = bufferFromStored(raw);
        const text = docxPlainText(buf).trim();
        if (text) previewById.set(body._id.toString(), text);
      }
    }

    const docsByFolder = new Map<string, (typeof folders)[number]["docs"]>();
    for (const row of rows) {
      const slotId = effectiveVaultSlot(row.category, row.slot);
      const folderId = folderIdForDocument(row.category, row.slot);
      const id = row._id.toString();
      const docx = isDocxFile(row.filename, row.mimeType);
      const list = docsByFolder.get(folderId) ?? [];
      list.push({
        id,
        filename: row.filename,
        sizeLabel: formatSize(row.sizeBytes),
        uploadedLabel: new Date(row.createdAt).toLocaleDateString(),
        slotId,
        kind: docx ? "docx" : "file",
        preview: previewById.get(id) ?? null,
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
      <section className="mb-4 max-w-2xl rounded-[18px] border border-[var(--color-cs-border)] bg-white p-4">
        <h2 className="text-[15px] font-semibold text-[var(--color-cs-text)]">Special Needs Trust records</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">{SNT_SUMMARY}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">{SNT_WORKFLOW}</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-cs-text-muted)]">{SNT_LIMITS}</p>
        {beneficiaryId ? (
          <a href="#snt" className="mt-2 inline-flex text-[13px] font-semibold text-[var(--color-cs-brand)] hover:underline">
            Open the disbursement register
          </a>
        ) : null}
      </section>
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
            canWrite={canWrite}
            sntProfile={sntProfile}
            sntDisbursements={sntDisbursements}
          />
        </>
      )}
    </>
  );
}
