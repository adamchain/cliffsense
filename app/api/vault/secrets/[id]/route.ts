import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import VaultSecret from "@/lib/db/models/VaultSecret";
import { decryptJson, encryptJson } from "@/lib/crypto/secret-box";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

function deriveHint(data: Record<string, string>): string {
  const candidate = data.number || data.memberId || data.cardNumber || "";
  const digits = candidate.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

/** Reveal: returns the decrypted sensitive fields. Access-gated and logged. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await connectDB();
  const row = await VaultSecret.findById(id).lean();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let data: Record<string, string> = {};
  if (row.dataEnc) {
    try {
      data = decryptJson<Record<string, string>>(row.dataEnc);
    } catch {
      return NextResponse.json({ error: "Could not decrypt this item." }, { status: 500 });
    }
  }

  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId.toString(),
    category: "vault",
    action: "vault.secret_reveal",
    resourceType: "vault_secret",
    resourceId: id,
    details: { kind: row.kind },
    severity: "security",
  });
  return NextResponse.json({ id, kind: row.kind, data });
}

const patchSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  url: z.string().trim().max(500).optional(),
  username: z.string().trim().max(200).optional(),
  cardCategory: z
    .enum(["insurance", "medicaid", "medicare", "pharmacy", "id", "other", ""])
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  /** When present, replaces the encrypted blob entirely. */
  data: z.record(z.string(), z.string().max(1000)).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await connectDB();
  const row = await VaultSecret.findById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const d = parsed.data;
  if (d.label !== undefined) row.label = d.label;
  if (d.url !== undefined) row.url = d.url;
  if (d.username !== undefined) row.username = d.username;
  if (d.cardCategory !== undefined) row.cardCategory = d.cardCategory;
  if (d.notes !== undefined) row.notes = d.notes;
  if (d.data !== undefined) {
    row.dataEnc = Object.keys(d.data).length > 0 ? encryptJson(d.data) : "";
    row.hint = deriveHint(d.data);
  }
  await row.save();

  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId.toString(),
    category: "vault",
    action: "vault.secret_update",
    resourceType: "vault_secret",
    resourceId: id,
    severity: "security",
  });
  return NextResponse.json({
    item: {
      id: row._id.toString(),
      kind: row.kind,
      label: row.label,
      url: row.url,
      username: row.username,
      cardCategory: row.cardCategory,
      hint: row.hint,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!objectId.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await connectDB();
  const row = await VaultSecret.findById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertBeneficiaryWriteAccess(session.user.id, row.beneficiaryId.toString());
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await row.deleteOne();
  await logActivity({
    userId: session.user.id,
    beneficiaryId: row.beneficiaryId.toString(),
    category: "vault",
    action: "vault.secret_delete",
    resourceType: "vault_secret",
    resourceId: id,
    severity: "security",
  });
  return NextResponse.json({ ok: true });
}
