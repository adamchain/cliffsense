import mongoose from "mongoose";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import { programCodeKey, programLabel } from "@/lib/benefits/program-meta";
import { normalizeConfidence, type DateConfidence } from "@/lib/reporting/obligations";

export type RenewalEnrollment = {
  program: string;
  nextRenewalDate?: Date | string | null;
  renewalConfidence?: string | null;
  /** Next scheduled interim report (e.g. SNAP SAR), tracked separately from renewal. */
  nextInterimReportDate?: Date | string | null;
  interimConfidence?: string | null;
};

export function renewalSourceKey(program: string): string {
  return `renewal:${programCodeKey(program)}`;
}

export function interimSourceKey(program: string): string {
  return `interim:${programCodeKey(program)}`;
}

function toUtcDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Wanted = {
  code: string;
  due: Date;
  kind: "renewal" | "sar";
  title: string;
  confidence: DateConfidence;
};

const NOTE = "Set in Settings · confirm with the agency";

/**
 * Upsert one renewal row and one interim-report row per enrolled program that
 * has those dates, and remove stale rows when a date is cleared or the program
 * is dropped. The two are separate obligations: saving one never completes,
 * moves, or clears the other. Progress on a row is kept unless its date changes.
 */
export async function syncRenewalDeadlines(opts: {
  beneficiaryId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  enrollments: RenewalEnrollment[];
}): Promise<void> {
  const bid = new mongoose.Types.ObjectId(String(opts.beneficiaryId));
  const uid = new mongoose.Types.ObjectId(String(opts.userId));

  const wanted = new Map<string, Wanted>();
  for (const e of opts.enrollments) {
    const code = programCodeKey(e.program);
    const renewal = toUtcDate(e.nextRenewalDate);
    if (renewal) {
      wanted.set(renewalSourceKey(code), {
        code,
        due: renewal,
        kind: "renewal",
        title: `${programLabel(code)} Renewal`,
        confidence: normalizeConfidence(e.renewalConfidence),
      });
    }
    const interim = toUtcDate(e.nextInterimReportDate);
    if (interim) {
      wanted.set(interimSourceKey(code), {
        code,
        due: interim,
        kind: "sar",
        title: `${programLabel(code)} Interim Report`,
        confidence: normalizeConfidence(e.interimConfidence),
      });
    }
  }

  const existing = await ReportingDeadline.find({
    beneficiaryId: bid,
    sourceKey: { $regex: /^(renewal|interim):/ },
  })
    .select("_id sourceKey dueDate")
    .lean();

  const toDelete = existing
    .filter((r) => r.sourceKey && !wanted.has(String(r.sourceKey)))
    .map((r) => r._id);
  if (toDelete.length > 0) {
    await ReportingDeadline.deleteMany({ _id: { $in: toDelete } });
  }

  const priorDue = new Map(
    existing.map((r) => [String(r.sourceKey), (r.dueDate as Date).getTime()]),
  );

  for (const [sourceKey, w] of wanted) {
    const dateChanged = priorDue.get(sourceKey) !== w.due.getTime();
    await ReportingDeadline.findOneAndUpdate(
      { beneficiaryId: bid, sourceKey },
      {
        $set: {
          userId: uid,
          program: w.code,
          dueDate: w.due,
          track: "scheduled",
          kind: w.kind,
          sourceKey,
          title: w.title,
          note: NOTE,
          confidence: w.confidence,
          // A new date is a new cycle; an unchanged date keeps its progress.
          ...(dateChanged
            ? {
                completedAt: null,
                preparedAt: null,
                submittedAt: null,
                proofDocumentId: null,
                acknowledgedAt: null,
                followUp: "",
              }
            : {}),
        },
        $setOnInsert: {
          beneficiaryId: bid,
        },
      },
      { upsert: true },
    );
  }
}
