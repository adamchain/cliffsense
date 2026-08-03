import mongoose from "mongoose";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import { programCodeKey, programLabel } from "@/lib/benefits/program-meta";

export type RenewalEnrollment = {
  program: string;
  nextRenewalDate?: Date | string | null;
};

export function renewalSourceKey(program: string): string {
  return `renewal:${programCodeKey(program)}`;
}

/**
 * Upsert one ReportingDeadline per enrolled program that has a nextRenewalDate,
 * and remove stale renewal rows when the date is cleared or the program is dropped.
 */
export async function syncRenewalDeadlines(opts: {
  beneficiaryId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  enrollments: RenewalEnrollment[];
}): Promise<void> {
  const bid = new mongoose.Types.ObjectId(String(opts.beneficiaryId));
  const uid = new mongoose.Types.ObjectId(String(opts.userId));

  const wanted = new Map<string, { code: string; due: Date }>();
  for (const e of opts.enrollments) {
    if (!e.nextRenewalDate) continue;
    const due =
      e.nextRenewalDate instanceof Date
        ? e.nextRenewalDate
        : new Date(`${String(e.nextRenewalDate).slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(due.getTime())) continue;
    const code = programCodeKey(e.program);
    wanted.set(renewalSourceKey(code), { code, due });
  }

  const existing = await ReportingDeadline.find({
    beneficiaryId: bid,
    kind: "renewal",
  })
    .select("_id sourceKey")
    .lean();

  const keep = new Set(wanted.keys());
  const toDelete = existing
    .filter((r) => r.sourceKey && !keep.has(String(r.sourceKey)))
    .map((r) => r._id);
  if (toDelete.length > 0) {
    await ReportingDeadline.deleteMany({ _id: { $in: toDelete } });
  }

  for (const [sourceKey, { code, due }] of wanted) {
    const title = `${programLabel(code)} Renewal`;
    await ReportingDeadline.findOneAndUpdate(
      { beneficiaryId: bid, sourceKey },
      {
        $set: {
          userId: uid,
          program: code,
          dueDate: due,
          track: "scheduled",
          kind: "renewal",
          sourceKey,
          title,
          note: "Set in Settings · confirm with the agency",
          completedAt: null,
        },
        $setOnInsert: {
          beneficiaryId: bid,
        },
      },
      { upsert: true },
    );
  }
}
