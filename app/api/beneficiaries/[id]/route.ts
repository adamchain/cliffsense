import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";
import { sendAlertEmailsForNewAlerts } from "@/lib/email/dispatch-alerts";
import { sendAlertPushForNewAlerts } from "@/lib/push/dispatch-push";
import { syncRenewalDeadlines } from "@/lib/reporting/sync-renewal-deadlines";
import { STORED_PROGRAMS } from "@/lib/programs";

const programEnum = z.enum(STORED_PROGRAMS);

const enrollmentSchema = z.object({
  program: programEnum,
  enrolledSince: z.coerce.date().optional().nullable(),
  nextRenewalDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.coerce.date(), z.null()])
    .optional()
    .nullable(),
  contextData: z.record(z.string(), z.unknown()).optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const patchSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  dateOfBirth: z.union([isoDate, z.null()]).optional(),
  state: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((s) => s === "" || s.length === 2, "State must be a 2-letter code")
    .optional(),
  county: z.string().trim().optional(),
  householdSize: z.coerce.number().int().min(1).optional(),
  benefitsEnrolled: z.array(enrollmentSchema).optional(),
});

function toDob(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === "") return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toRenewalDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await connectDB();
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const existing = await Beneficiary.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const $set: Record<string, unknown> = {};
  if (parsed.data.firstName !== undefined) $set.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) $set.lastName = parsed.data.lastName;
  if (parsed.data.dateOfBirth !== undefined) $set.dateOfBirth = toDob(parsed.data.dateOfBirth);
  if (parsed.data.state !== undefined) $set.state = parsed.data.state;
  if (parsed.data.county !== undefined) $set.county = parsed.data.county;
  if (parsed.data.householdSize !== undefined) $set.householdSize = parsed.data.householdSize;

  let nextEnrolled: {
    program: string;
    enrolledSince: Date;
    nextRenewalDate: Date | null;
    contextData: Record<string, unknown>;
  }[] | null = null;
  if (parsed.data.benefitsEnrolled) {
    const priorByProgram = new Map(
      (existing.benefitsEnrolled ?? []).map((b) => [String(b.program), b]),
    );
    nextEnrolled = parsed.data.benefitsEnrolled.map((b) => {
      const prior = priorByProgram.get(b.program);
      const renewalProvided = Object.prototype.hasOwnProperty.call(b, "nextRenewalDate");
      return {
        program: b.program,
        enrolledSince: (b.enrolledSince ?? prior?.enrolledSince ?? new Date()) as Date,
        nextRenewalDate: renewalProvided
          ? toRenewalDate(b.nextRenewalDate)
          : (prior?.nextRenewalDate as Date | null | undefined) ?? null,
        contextData: (b.contextData ?? prior?.contextData ?? {}) as Record<string, unknown>,
      };
    });
    $set.benefitsEnrolled = nextEnrolled;
  }

  if (Object.keys($set).length > 0) {
    await Beneficiary.findByIdAndUpdate(id, { $set });
  }

  if (nextEnrolled) {
    await syncRenewalDeadlines({
      beneficiaryId: id,
      userId: session.user.id,
      enrollments: nextEnrolled,
    });
  }

  const updated = await Beneficiary.findById(id);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logActivity({
    userId: session.user.id,
    beneficiaryId: updated._id,
    category: "beneficiary",
    action: "beneficiary.updated",
    details: {
      fields: Object.keys($set),
      benefits: (updated.benefitsEnrolled ?? []).map((b) => b.program),
    },
  });

  const shouldReevaluate =
    parsed.data.benefitsEnrolled !== undefined || parsed.data.householdSize !== undefined;
  if (shouldReevaluate) {
    try {
      const er = await evaluateThresholdsForBeneficiary({
        beneficiaryId: new mongoose.Types.ObjectId(id),
        actorUserId: session.user.id,
      });
      const ids = er.alertIdsCreated.map((x) => x.toString());
      await sendAlertEmailsForNewAlerts(ids);
      await sendAlertPushForNewAlerts(ids);
    } catch (e) {
      console.warn("evaluateThresholdsForBeneficiary after benefits update", e);
    }
  }

  return NextResponse.json({ beneficiary: updated });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await connectDB();
  const allowed = await assertBeneficiaryAccess(session.user.id, id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ben = await Beneficiary.findById(id)
    .select("firstName lastName dateOfBirth state county householdSize isOwner")
    .lean();
  if (!ben) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ beneficiary: ben });
}
