import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { DEADLINE_KINDS } from "@/lib/calendar/deadline-kinds";
import { DATE_CONFIDENCES } from "@/lib/reporting/obligations";

/**
 * A dated obligation — renewal / review, interim report (SAR), change report,
 * or an agency request for documents — plus user-entered appointments. Each row
 * is its own obligation with its own completion tracking. Dates set in Settings
 * use a stable sourceKey (`renewal:SSI`, `interim:SNAP`) for upserts.
 */
const reportingDeadlineSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** UPPERCASE program code (e.g. "SNAP"), or null for general. */
    program: { type: String, default: null, trim: true, uppercase: true },
    /** Calendar date the report/renewal is due (UTC midnight). */
    dueDate: { type: Date, required: true },
    track: { type: String, enum: ["scheduled", "event"], default: "scheduled" },
    /** Distinguishes vital renewals from ad-hoc deadlines. */
    kind: {
      type: String,
      enum: [...DEADLINE_KINDS],
      default: "deadline",
      index: true,
    },
    /**
     * Stable key for upserts from Settings renewals, e.g. "renewal:SSI".
     * Null for manually added calendar deadlines.
     */
    sourceKey: { type: String, default: null, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    note: { type: String, default: "", trim: true, maxlength: 1000 },
    /**
     * How sure we are of this date. Only a date read off an agency notice is
     * "confirmed"; a date worked out from program rules is "estimated"; anything
     * else (including dates typed in without a notice) is "needs_confirmation".
     */
    confidence: {
      type: String,
      enum: [...DATE_CONFIDENCES],
      default: "needs_confirmation",
    },
    /** The notice this date came from (Vault document), kept beside the deadline. */
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    /** Plain-text source, e.g. "PA 600 notice dated 9/14" or an official rule URL. */
    sourceNote: { type: String, default: "", trim: true, maxlength: 500 },
    /**
     * Completion tracking for this one obligation. Completing it never marks a
     * different obligation (another program, or the renewal vs. an interim report) done.
     */
    preparedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    proofDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    acknowledgedAt: { type: Date, default: null },
    followUp: { type: String, default: "", trim: true, maxlength: 1000 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportingDeadlineSchema.index({ beneficiaryId: 1, dueDate: 1 });
reportingDeadlineSchema.index(
  { beneficiaryId: 1, sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

export type ReportingDeadlineDoc = InferSchemaType<typeof reportingDeadlineSchema> & {
  _id: mongoose.Types.ObjectId;
};

// Next.js hot-reload keeps the first-compiled model; drop it so schema additions
// (kind, sourceKey) are always applied.
const MODEL_NAME = "ReportingDeadline";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const ReportingDeadline: Model<ReportingDeadlineDoc> = mongoose.model<ReportingDeadlineDoc>(
  MODEL_NAME,
  reportingDeadlineSchema,
);

export default ReportingDeadline;
