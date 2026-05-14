import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const alertSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    thresholdId: { type: Schema.Types.ObjectId, ref: "Threshold", default: null, index: true },
    level: { type: String, enum: ["info", "warning", "breach"], required: true },
    trigger: { type: String, enum: ["predictive", "breach", "trend"], required: true },
    message: { type: String, required: true },
    dataSnapshot: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["new", "acknowledged", "resolved", "dismissed"],
      default: "new",
      index: true,
    },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

alertSchema.index({ beneficiaryId: 1, createdAt: -1 });

export type AlertDoc = InferSchemaType<typeof alertSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const Alert: Model<AlertDoc> = mongoose.models?.Alert ?? mongoose.model<AlertDoc>("Alert", alertSchema);

export default Alert;
