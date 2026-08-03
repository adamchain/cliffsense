import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";
import { evaluateThresholdsForBeneficiary } from "@/lib/thresholds/evaluate-thresholds";
import { sendAlertEmailsForNewAlerts } from "@/lib/email/dispatch-alerts";
import { sendAlertPushForNewAlerts } from "@/lib/push/dispatch-push";
import { syncRenewalDeadlines } from "@/lib/reporting/sync-renewal-deadlines";

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

const enrollmentSchema = z.object({
  program: programEnum,
  enrolledSince: z.coerce.date().optional().nullable(),
  nextRenewalDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.coerce.date(), z.null()])
    .optional()
    .nullable(),
  contextData: z.record(z.string(), z.unknown()).optional(),
});

const patchSchema = z.object({
  benefitsEnrolled: z.array(enrollmentSchema).optional(),
});

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

  if (parsed.data.benefitsEnrolled) {
    const priorByProgram = new Map(
      (existing.benefitsEnrolled ?? []).map((b) => [String(b.program), b]),
    );
    const nextEnrolled = parsed.data.benefitsEnrolled.map((b) => {
      const prior = priorByProgram.get(b.program);
      const renewalProvided = Object.prototype.hasOwnProperty.call(b, "nextRenewalDate");
      return {
        program: b.program,
        enrolledSince: b.enrolledSince ?? prior?.enrolledSince ?? new Date(),
        nextRenewalDate: renewalProvided
          ? toRenewalDate(b.nextRenewalDate)
          : (prior?.nextRenewalDate as Date | null | undefined) ?? null,
        contextData: b.contextData ?? prior?.contextData ?? {},
      };
    });

    await Beneficiary.findByIdAndUpdate(id, {
      $set: { benefitsEnrolled: nextEnrolled },
    });

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
      benefits: (updated.benefitsEnrolled ?? []).map((b) => b.program),
    },
  });

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

  return NextResponse.json({ beneficiary: updated });
}
