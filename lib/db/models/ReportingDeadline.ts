import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A user-entered dated reporting deadline — the SAR/renewal/recert dates that are
 * printed on a mailed form and can't be derived from rules alone. Surfaced in the
 * reporting calendar alongside the rule-generated fixed-window events.
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
    title: { type: String, required: true, trim: true, maxlength: 200 },
    note: { type: String, default: "", trim: true, maxlength: 1000 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportingDeadlineSchema.index({ beneficiaryId: 1, dueDate: 1 });

export type ReportingDeadlineDoc = InferSchemaType<typeof reportingDeadlineSchema> & {
  _id: mongoose.Types.ObjectId;
};

const ReportingDeadline: Model<ReportingDeadlineDoc> =
  mongoose.models?.ReportingDeadline ??
  mongoose.model<ReportingDeadlineDoc>("ReportingDeadline", reportingDeadlineSchema);

export default ReportingDeadline;
