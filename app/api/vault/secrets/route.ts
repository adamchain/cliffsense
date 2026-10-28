import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import VaultSecret from "@/lib/db/models/VaultSecret";
import { encryptJson, secretStorageAvailable } from "@/lib/crypto/secret-box";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/** Last 4 of the most card-number-like value, for a safe list hint. */
function deriveHint(data: Record<string, string>): string {
  const candidate = data.number || data.memberId || data.cardNumber || "";
  const digits = candidate.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const beneficiaryId = new URL(req.url).searchParams.get("beneficiaryId") ?? "";
  if (!objectId.safeParse(beneficiaryId).success) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const rows = await VaultSecret.find({ beneficiaryId })
    .select("kind label url username cardCategory hint notes updatedAt")
    .sort({ kind: 1, updatedAt: -1 })
    .lean();

  // Never includes decrypted secrets — reveal is a separate, logged call.
  return NextResponse.json({
    items: rows.map((r) => ({
      id: r._id.toString(),
      kind: r.kind,
      label: r.label,
      url: r.url ?? "",
      username: r.username ?? "",
      cardCategory: r.cardCategory ?? "",
      hint: r.hint ?? "",
      notes: r.notes ?? "",
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    })),
  });
}

const createSchema = z.object({
  beneficiaryId: objectId,
  kind: z.enum(["login", "card"]),
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().max(500).default(""),
  username: z.string().trim().max(200).default(""),
  cardCategory: z
    .enum(["insurance", "medicaid", "medicare", "pharmacy", "id", "other", ""])
    .default(""),
  notes: z.string().trim().max(2000).default(""),
  /** Sensitive fields to encrypt (password, number, memberId, …). */
  data: z.record(z.string(), z.string().max(1000)).default({}),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!secretStorageAvailable()) {
    return NextResponse.json(
      { error: "Secure storage isn't configured. Set VAULT_SECRET_KEY to enable logins and cards." },
      { status: 503 },
    );
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a label and check the fields." }, { status: 400 });
  }
  const data = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, data.beneficiaryId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const doc = await VaultSecret.create({
    beneficiaryId: new mongoose.Types.ObjectId(data.beneficiaryId),
    createdByUserId: new mongoose.Types.ObjectId(session.user.id),
    kind: data.kind,
    label: data.label,
    url: data.url,
    username: data.username,
    cardCategory: data.cardCategory,
    hint: deriveHint(data.data),
    notes: data.notes,
    dataEnc: Object.keys(data.data).length > 0 ? encryptJson(data.data) : "",
  });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: data.beneficiaryId,
    category: "vault",
    action: "vault.secret_create",
    resourceType: "vault_secret",
    resourceId: doc._id.toString(),
    details: { kind: data.kind },
    severity: "security",
  });
  return NextResponse.json({
    item: {
      id: doc._id.toString(),
      kind: doc.kind,
      label: doc.label,
      url: doc.url,
      username: doc.username,
      cardCategory: doc.cardCategory,
      hint: doc.hint,
      notes: doc.notes,
      updatedAt: doc.updatedAt.toISOString(),
    },
  });
}
