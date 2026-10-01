import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity/log-activity";
import { playbookById, resolveAlertPlaybook } from "@/lib/alerts/alert-playbook";
import { initialCaseWorkflow } from "@/lib/alerts/case-workflow";
import { composeTenPart, type ChangeConfidence } from "@/lib/alerts/ten-part";
import Alert from "@/lib/db/models/Alert";
import ContinuityCase from "@/lib/db/models/ContinuityCase";

export async function createContinuityAlert(input: {
  beneficiaryId: Types.ObjectId;
  ownerUserId: Types.ObjectId | string;
  actorUserId: string;
  level: "info" | "warning" | "breach";
  trigger: "predictive" | "breach" | "trend" | "cliff" | "reporting" | "snt" | "able";
  message: string;
  thresholdId?: Types.ObjectId | null;
  dataSnapshot: Record<string, unknown>;
  playbookId: string;
  eventSummary: string;
  changeConfidence: ChangeConfidence;
  observedAt?: Date;
  noticeDeadline?: string | null;
  userNote?: string | null;
  activityDetails?: Record<string, unknown>;
}): Promise<Types.ObjectId> {
  const playbook = playbookById(input.playbookId) ?? resolveAlertPlaybook({ playbookId: input.playbookId });
  const parts = composeTenPart({
    playbook,
    eventSummary: input.eventSummary,
    changeConfidence: input.changeConfidence,
    observedAt: input.observedAt ?? new Date(),
    noticeDeadline: input.noticeDeadline,
    userNote: input.userNote,
  });
  const workflow = initialCaseWorkflow(parts);
  const created = await Alert.create({
    beneficiaryId: input.beneficiaryId,
    userId: input.ownerUserId,
    thresholdId: input.thresholdId ?? null,
    level: input.level,
    trigger: input.trigger,
    message: input.message,
    dataSnapshot: {
      ...input.dataSnapshot,
      playbookId: playbook.id,
    },
    parts,
    status: "new",
  });

  try {
    const opened = await ContinuityCase.create({
      beneficiaryId: input.beneficiaryId,
      alertId: created._id,
      ownerUserId: input.ownerUserId,
      status: workflow.status,
      parts: workflow.parts,
      evidence: workflow.evidence,
      tasks: workflow.tasks,
      submission: workflow.submission,
      acknowledgment: workflow.acknowledgment,
      followUp: workflow.followUp,
    });
    created.caseId = opened._id;
    await created.save();
  } catch (error) {
    await Alert.deleteOne({ _id: created._id });
    throw error;
  }

  await logActivity({
    userId: input.actorUserId,
    beneficiaryId: input.beneficiaryId,
    category: "alert",
    action: "alert.created",
    resourceType: "alert",
    resourceId: created._id.toString(),
    details: {
      playbookId: playbook.id,
      changeConfidence: input.changeConfidence,
      ruleVersions: parts.affectedBenefits.map((benefit) => benefit.rule.version),
      ...input.activityDetails,
    },
  });

  return created._id as Types.ObjectId;
}
