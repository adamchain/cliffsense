import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const alertSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    thresholdId: { type: Schema.Types.ObjectId, ref: "Threshold", default: null, index: true },
    level: { type: String, enum: ["info", "warning", "breach"], required: true },
    trigger: { type: String, enum: ["predictive", "breach", "trend", "cliff", "reporting", "snt", "able"], required: true },
    message: { type: String, required: true },
    dataSnapshot: { type: Schema.Types.Mixed, default: {} },
    /** Ten-part alert content. Null on alerts created before this field existed. */
    parts: { type: Schema.Types.Mixed, default: null },
    caseId: { type: Schema.Types.ObjectId, ref: "ContinuityCase", default: null },
    status: {
      type: String,
      enum: ["new", "acknowledged", "resolved", "dismissed"],
      default: "new",
      index: true,
    },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    pushSent: { type: Boolean, default: false },
    pushSentAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

alertSchema.index({ beneficiaryId: 1, createdAt: -1 });

export type AlertDoc = InferSchemaType<typeof alertSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const MODEL_NAME = "Alert";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const Alert: Model<AlertDoc> = mongoose.model<AlertDoc>(MODEL_NAME, alertSchema);

export default Alert;
