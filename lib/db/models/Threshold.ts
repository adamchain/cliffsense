import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const thresholdSchema = new Schema(
  {
    scope: { type: String, enum: ["system", "user"], required: true, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", default: null, index: true },
    program: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    state: { type: String, default: null, trim: true, uppercase: true },
    thresholdType: {
      type: String,
      enum: [
        "monthly_earned_income",
        "monthly_unearned_income",
        "annual_income",
        "asset_balance",
        "transaction_amount",
        "custom",
      ],
      required: true,
    },
    limitCents: { type: Number, required: true },
    comparison: { type: String, enum: ["lte", "lt", "gte", "gt"], required: true },
    warnAtPercent: { type: Number, default: 0.85, min: 0, max: 1 },
    effectiveFrom: { type: Date, default: () => new Date("2025-01-01T00:00:00.000Z") },
    effectiveTo: { type: Date, default: null },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    /** Stable id for upserting bundled system rows */
    systemKey: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

thresholdSchema.index({ scope: 1, beneficiaryId: 1 });
thresholdSchema.index(
  { systemKey: 1 },
  { unique: true, partialFilterExpression: { systemKey: { $type: "string" } } },
);

export type ThresholdDoc = InferSchemaType<typeof thresholdSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Threshold: Model<ThresholdDoc> =
  mongoose.models?.Threshold ?? mongoose.model<ThresholdDoc>("Threshold", thresholdSchema);

export default Threshold;
