import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

const THRESHOLD_TYPES = [
  "monthly_earned_income",
  "monthly_unearned_income",
  "monthly_gross_income",
  "annual_income",
  "asset_balance",
  "transaction_amount",
  "custom",
] as const;

const createSchema = z.object({
  label: z.string().min(1).max(200),
  program: z.string().max(40).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  thresholdType: z.enum(THRESHOLD_TYPES),
  limitCents: z.number().int().positive(),
  comparison: z.enum(["lte", "lt", "gte", "gt"]),
  warnAtPercent: z.number().min(0).max(1).optional(),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().max(500).optional(),
  systemKey: z.string().max(120).optional().nullable(),
});

/** Create a new bundled/system threshold from the admin console. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const systemKey = d.systemKey?.trim() || null;

  await connectDB();
  if (systemKey) {
    const clash = await Threshold.exists({ systemKey });
    if (clash) {
      return NextResponse.json({ error: "That system key is already in use." }, { status: 409 });
    }
  }

  let doc;
  try {
    doc = await Threshold.create({
      scope: "system",
      ownerUserId: null,
      beneficiaryId: null,
      program: d.program?.trim() || null,
      state: d.state?.trim() || null,
      thresholdType: d.thresholdType,
      limitCents: d.limitCents,
      comparison: d.comparison,
      warnAtPercent: d.warnAtPercent ?? 0.85,
      label: d.label.trim(),
      description: d.description?.trim() ?? "",
      sourceUrl: d.sourceUrl?.trim() ?? "",
      systemKey,
      // Admin-authored rows carry an override marker from birth so a future
      // seed sharing this key can never silently clobber them.
      overriddenByAdminAt: systemKey ? new Date() : null,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "That system key is already in use." }, { status: 409 });
    }
    throw err;
  }

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "create_threshold",
    details: { thresholdId: doc._id.toString(), label: doc.label, program: doc.program },
    ...clientMeta(req),
  });

  return NextResponse.json({ threshold: doc });
}
