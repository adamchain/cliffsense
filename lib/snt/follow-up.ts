import type { Types } from "mongoose";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";

/** Calendar row for an SNT follow-up date. Removed when the date is cleared. */
export async function syncSntFollowUp(input: {
  beneficiaryId: Types.ObjectId;
  userId: Types.ObjectId;
  disbursementId: Types.ObjectId;
  payee: string;
  purpose: string;
  followUpDate: string | null;
}): Promise<void> {
  const sourceKey = `snt:${input.disbursementId.toString()}`;
  if (!input.followUpDate) {
    await ReportingDeadline.deleteOne({ beneficiaryId: input.beneficiaryId, sourceKey });
    return;
  }
  const title = `SNT follow-up: ${input.payee}`.slice(0, 200);
  await ReportingDeadline.findOneAndUpdate(
    { beneficiaryId: input.beneficiaryId, sourceKey },
    {
      $set: {
        userId: input.userId,
        dueDate: new Date(`${input.followUpDate}T00:00:00.000Z`),
        title,
        note: input.purpose.slice(0, 1000),
        kind: "other",
        track: "scheduled",
        confidence: "needs_confirmation",
        sourceNote: "Entered on the SNT disbursement register",
        program: null,
      },
      $setOnInsert: {
        beneficiaryId: input.beneficiaryId,
        sourceKey,
      },
    },
    { upsert: true },
  );
}

export async function removeSntFollowUp(
  beneficiaryId: Types.ObjectId,
  disbursementId: Types.ObjectId,
): Promise<void> {
  await ReportingDeadline.deleteOne({
    beneficiaryId,
    sourceKey: `snt:${disbursementId.toString()}`,
  });
}
