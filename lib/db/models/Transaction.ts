import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import "./ClassificationRule";

const transactionSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    bankConnectionId: { type: Schema.Types.ObjectId, ref: "BankConnection", required: true, index: true },
    /**
     * How this transaction entered the app. Plaid-synced rows keep the real
     * Plaid `transaction_id`; imported rows carry a synthetic stable id
     * (`import:<hash>`) so the unique index still dedupes re-imports of the
     * same file.
     */
    source: { type: String, enum: ["plaid", "import"], default: "plaid", index: true },
    /** The staged import this row came from (source === "import"). */
    importBatchId: { type: Schema.Types.ObjectId, ref: "ImportBatch", default: null },
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
    /** A receipt (VaultDocument) the user attached to this transaction. */
    receiptDocumentId: { type: Schema.Types.ObjectId, ref: "VaultDocument", default: null },
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
