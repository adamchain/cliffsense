import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { ELIGIBILITY_LOSS_SCENARIOS, scenarioById } from "@/lib/alerts/eligibility-loss-scenarios";
import { createContinuityAlert } from "@/lib/alerts/create-continuity-alert";
import { serializeContinuityCase } from "@/lib/alerts/serialize-case";
import { assertBeneficiaryAccess, assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Alert from "@/lib/db/models/Alert";
import Beneficiary from "@/lib/db/models/Beneficiary";
import ContinuityCase from "@/lib/db/models/ContinuityCase";
import { enrolledMatchesProgram } from "@/lib/programs";

const postSchema = z.object({
  beneficiaryId: z.string().min(1),
  scenarioId: z.string().min(1),
  note: z.string().max(1000).optional(),
  noticeDeadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const beneficiaryId = new URL(req.url).searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const ben = await Beneficiary.findById(beneficiaryId).select("benefitsEnrolled").lean();
  const programs = (ben?.benefitsEnrolled ?? []).map((row) => String(row.program ?? ""));
  const manual = ELIGIBILITY_LOSS_SCENARIOS.filter((scenario) => !scenario.autoDetect);
  const matched = programs.length
    ? manual.filter((scenario) => scenario.programs.some((program) => enrolledMatchesProgram(programs, program)))
    : manual;
  const scenarios = (matched.length ? matched : manual).map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    risk: scenario.risk,
  }));
  return NextResponse.json({ scenarios });
}

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
  const { beneficiaryId, scenarioId, note, noticeDeadline } = parsed.data;
  const ok = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const scenario = scenarioById(scenarioId);
  if (!scenario || scenario.autoDetect) {
    return NextResponse.json({ error: "That event is not available to report by hand." }, { status: 400 });
  }

  await connectDB();
  const ben = await Beneficiary.findById(beneficiaryId).select("ownerUserId").lean();
  if (!ben?.ownerUserId) {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }

  const existing = await Alert.findOne({
    beneficiaryId,
    "dataSnapshot.scenarioId": scenarioId,
    status: { $in: ["new", "acknowledged"] },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (existing) {
    const opened = await ContinuityCase.findOne({ alertId: existing._id }).lean();
    return NextResponse.json({
      alreadyOpen: true,
      alertId: existing._id.toString(),
      continuityCase: opened ? serializeContinuityCase(opened) : null,
    });
  }

  const level = scenario.level === "info" ? "info" : scenario.level === "breach" ? "breach" : "warning";
  const alertId = await createContinuityAlert({
    beneficiaryId: new mongoose.Types.ObjectId(beneficiaryId),
    ownerUserId: ben.ownerUserId,
    actorUserId: session.user.id,
    level,
    trigger: scenario.trigger,
    message: `${scenario.title}: ${scenario.risk}`,
    dataSnapshot: {
      scenarioId: scenario.id,
      playbookId: scenario.id,
      title: scenario.title,
      programs: scenario.programs,
      monthPrefix: new Date().toISOString().slice(0, 7),
      reportedByUserId: session.user.id,
    },
    playbookId: scenario.id,
    eventSummary: scenario.risk,
    changeConfidence: "confirmed",
    noticeDeadline: noticeDeadline ?? null,
    userNote: note ?? null,
    activityDetails: { scenarioId: scenario.id, source: "report-event" },
  });

  const opened = await ContinuityCase.findOne({ alertId }).lean();
  return NextResponse.json({
    alreadyOpen: false,
    alertId: alertId.toString(),
    continuityCase: opened ? serializeContinuityCase(opened) : null,
  });
}
