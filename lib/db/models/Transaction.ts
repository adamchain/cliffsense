import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import "./ClassificationRule";

const transactionSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    bankConnectionId: { type: Schema.Types.ObjectId, ref: "BankConnection", required: true, index: true },
    plaidTransactionId: { type: String, required: true },
    date: { type: String, required: true },
    postedDate: { type: String, default: "" },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    name: { type: String, default: "" },
    merchantName: { type: String, default: "" },
    category: { type: String, default: "" },
    plaidCategory: { type: String, default: "" },
    /** Plaid personal_finance_category.primary (when available) */
    pfcPrimary: { type: String, default: "" },
    /** Plaid personal_finance_category.detailed */
    pfcDetailed: { type: String, default: "" },
    pending: { type: Boolean, default: false },
    userCategory: {
      type: String,
      enum: ["earned_income", "benefit_deposit", "other_income", "expense", "transfer", "unclear"],
      default: "unclear",
    },
    excludedFromThresholds: { type: Boolean, default: false, index: true },
    excludeReason: { type: String, default: "" },
    recurringStreamId: { type: Schema.Types.ObjectId, ref: "RecurringStream", default: null },
    notes: { type: String, default: "" },
    appliedRuleId: { type: Schema.Types.ObjectId, ref: "ClassificationRule", default: null },
    lastUserEditedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

transactionSchema.index({ beneficiaryId: 1, plaidTransactionId: 1 }, { unique: true });
transactionSchema.index({ beneficiaryId: 1, date: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const Transaction: Model<TransactionDoc> =
  mongoose.models?.Transaction ?? mongoose.model<TransactionDoc>("Transaction", transactionSchema);

export default Transaction;
