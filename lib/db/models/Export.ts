import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const exportSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    format: {
      type: String,
      enum: ["csv", "pdf", "json", "zip"],
      required: true,
    },
    dataset: {
      type: String,
      enum: ["transactions", "recurring", "alerts", "thresholds", "activity", "bundle"],
      required: true,
    },
    fromDate: { type: String, default: "" },
    toDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["queued", "ready", "failed"],
      default: "queued",
    },
    failureReason: { type: String, default: "" },
    filename: { type: String, default: "" },
    mimeType: { type: String, default: "application/octet-stream" },
    sizeBytes: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    content: { type: Buffer, default: null },
  },
  { timestamps: true },
);

exportSchema.index({ beneficiaryId: 1, createdAt: -1 });

export type ExportDoc = InferSchemaType<typeof exportSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const ExportJob: Model<ExportDoc> =
  mongoose.models?.ExportJob ?? mongoose.model<ExportDoc>("ExportJob", exportSchema);

export default ExportJob;
