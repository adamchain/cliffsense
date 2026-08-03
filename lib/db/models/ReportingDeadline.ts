import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A dated reporting deadline — SAR / renewal / recert dates printed on a mailed
 * form, plus user-entered appointments. Renewals set in Settings use
 * kind="renewal" and a stable sourceKey (`renewal:SSI`) for upserts.
 */
const reportingDeadlineSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** UPPERCASE program code (e.g. "SNAP", "SECTION8"), or null for general. */
    program: { type: String, default: null, trim: true, uppercase: true },
    /** Calendar date the report/renewal is due (UTC midnight). */
    dueDate: { type: Date, required: true },
    track: { type: String, enum: ["scheduled", "event"], default: "scheduled" },
    /** Distinguishes vital renewals from ad-hoc deadlines. */
    kind: {
      type: String,
      enum: ["renewal", "deadline", "sar", "appointment", "other"],
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
