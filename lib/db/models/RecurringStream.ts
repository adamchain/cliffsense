import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const recurringStreamSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    bankConnectionId: { type: Schema.Types.ObjectId, ref: "BankConnection", required: true, index: true },
    plaidStreamId: { type: String, required: true },
    description: { type: String, default: "" },
    merchantName: { type: String, default: "" },
    type: { type: String, enum: ["inflow", "outflow"], required: true },
    averageAmountCents: { type: Number, required: true },
    lastAmountCents: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", "semimonthly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["mature", "early_detection"],
      required: true,
    },
    userCategory: {
      type: String,
      enum: ["earned_income", "benefit_deposit", "other_income", "subscription", "rent", "other"],
      default: "other",
    },
    isConfirmed: { type: Boolean, default: false },
    excludedFromThresholds: { type: Boolean, default: false },
    excludeReason: { type: String, default: "" },
    firstDate: { type: String, default: "" },
    lastDate: { type: String, default: "" },
    predictedNextDate: { type: String, default: "" },
    predictedNextAmountCents: { type: Number, default: null },
  },
  { timestamps: true },
);

recurringStreamSchema.index({ beneficiaryId: 1, plaidStreamId: 1 }, { unique: true });

export type RecurringStreamDoc = InferSchemaType<typeof recurringStreamSchema> & {
  _id: mongoose.Types.ObjectId;
};

const RecurringStream: Model<RecurringStreamDoc> =
  mongoose.models?.RecurringStream ??
  mongoose.model<RecurringStreamDoc>("RecurringStream", recurringStreamSchema);

export default RecurringStream;
