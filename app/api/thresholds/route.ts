import { auth } from "@/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { logActivity } from "@/lib/activity/log-activity";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";
import { ensureSystemThresholdsSeeded } from "@/lib/thresholds/ensure-system-thresholds";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  await ensureSystemThresholdsSeeded();
  const payload = await loadThresholdDashboardPayload(new mongoose.Types.ObjectId(beneficiaryId));
  return NextResponse.json(payload);
}

const programEnum = z.enum([
  "SSI",
  "SSDI",
  "SNAP",
  "Medicaid",
  "Section8",
  "TANF",
  "WIC",
  "LIHEAP",
  "ACA",
  "VA",
  "ABLE",
]);

const postSchema = z.object({
  beneficiaryId: z.string().min(1),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  program: programEnum.optional().nullable(),
  thresholdType: z.enum(["monthly_earned_income", "asset_balance"]),
  limitCents: z.number().int().positive(),
  warnAtPercent: z.number().min(0.5).max(0.99).optional(),
  comparison: z.enum(["lte", "lt", "gte", "gt"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const ok = await assertBeneficiaryWriteAccess(session.user.id, parsed.data.beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const doc = await Threshold.create({
    scope: "user",
    ownerUserId: new mongoose.Types.ObjectId(session.user.id),
    beneficiaryId: new mongoose.Types.ObjectId(parsed.data.beneficiaryId),
    program: parsed.data.program ?? null,
    state: null,
    thresholdType: parsed.data.thresholdType,
    limitCents: parsed.data.limitCents,
    comparison: parsed.data.comparison ?? "lte",
    warnAtPercent: parsed.data.warnAtPercent ?? 0.85,
    effectiveFrom: new Date(),
    effectiveTo: null,
    label: parsed.data.label,
    description: parsed.data.description ?? "",
    sourceUrl: "",
    systemKey: null,
  });

  await logActivity({
    userId: session.user.id,
    beneficiaryId: parsed.data.beneficiaryId,
    category: "threshold",
    action: "threshold.created",
    resourceType: "threshold",
    resourceId: doc._id.toString(),
    details: { label: doc.label },
  });

  return NextResponse.json({ threshold: doc });
}
