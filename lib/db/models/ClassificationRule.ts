import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const matcherSchema = new Schema(
  {
    merchantName: { type: String, default: "" },
    descriptionRegex: { type: String, default: "" },
    amountMinCents: { type: Number, default: null },
    amountMaxCents: { type: Number, default: null },
    recurringStreamId: { type: Schema.Types.ObjectId, ref: "RecurringStream", default: null },
  },
  { _id: false },
);

const actionSchema = new Schema(
  {
    userCategory: { type: String, default: "" },
    excludeFromThresholds: { type: Boolean, default: false },
    reason: { type: String, default: "" },
  },
  { _id: false },
);

const classificationRuleSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    scope: {
      type: String,
      enum: ["merchant", "description-regex", "amount-range", "recurring-stream"],
      required: true,
    },
    matcher: { type: matcherSchema, required: true },
    action: { type: actionSchema, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

classificationRuleSchema.index({ beneficiaryId: 1, active: 1 });

export type ClassificationRuleDoc = InferSchemaType<typeof classificationRuleSchema> & {
  _id: mongoose.Types.ObjectId;
};

const ClassificationRule: Model<ClassificationRuleDoc> =
  mongoose.models?.ClassificationRule ??
  mongoose.model<ClassificationRuleDoc>("ClassificationRule", classificationRuleSchema);

export default ClassificationRule;
