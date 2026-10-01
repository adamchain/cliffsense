import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const continuityCaseSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    alertId: { type: Schema.Types.ObjectId, ref: "Alert", required: true, unique: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["open", "waiting_on_agency", "closed"],
      default: "open",
      index: true,
    },
    parts: { type: Schema.Types.Mixed, required: true },
    evidence: { type: [Schema.Types.Mixed], default: [] },
    tasks: { type: [Schema.Types.Mixed], default: [] },
    submission: { type: Schema.Types.Mixed, default: null },
    acknowledgment: { type: Schema.Types.Mixed, default: null },
    followUp: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

continuityCaseSchema.index({ beneficiaryId: 1, status: 1 });

export type ContinuityCaseDoc = InferSchemaType<typeof continuityCaseSchema> & {
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = "ContinuityCase";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const ContinuityCase: Model<ContinuityCaseDoc> = mongoose.model<ContinuityCaseDoc>(
  MODEL_NAME,
  continuityCaseSchema,
);

export default ContinuityCase;
