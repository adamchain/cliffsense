import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A single parsed-and-normalized row staged for import. Duplicate detection
 * runs at preview time and its verdict is stored here so the commit step is a
 * cheap, authoritative replay (no need to trust the client with row payloads).
 */
const importRowSchema = new Schema(
  {
    /** Stable synthetic id used as the Transaction `plaidTransactionId`. */
    importKey: { type: String, required: true },
    date: { type: String, required: true },
    postedDate: { type: String, default: "" },
    /** App convention: negative = money in, positive = money out. */
    amountCents: { type: Number, required: true },
    name: { type: String, default: "" },
    merchantName: { type: String, default: "" },
    category: { type: String, default: "" },
    /** Suggested MyBenefitsPA userCategory (may be overridden by rules on commit). */
    suggestedUserCategory: { type: String, default: "unclear" },
    /** The original CSV line, kept for audit / troubleshooting. */
    rawLine: { type: String, default: "" },
    dupStatus: { type: String, enum: ["new", "duplicate_in_file", "duplicate_existing"], default: "new" },
    /** When dupStatus === "duplicate_existing", the transaction it matched. */
    dupTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction", default: null },
    /** User decision at commit: import it or skip. Defaults follow dupStatus. */
    decision: { type: String, enum: ["import", "skip"], default: "import" },
  },
  { _id: true },
);

const importBatchSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** The synthetic "Imported statements" bank connection rows are attached to. */
    bankConnectionId: { type: Schema.Types.ObjectId, ref: "BankConnection", default: null },
    filename: { type: String, default: "" },
    /** Friendly label for the source bank/account, shown in the accounts panel. */
    sourceLabel: { type: String, default: "Imported statements" },
    status: {
      type: String,
      enum: ["staged", "committed", "discarded"],
      default: "staged",
      index: true,
    },
    /** Column + sign interpretation used to normalize the file. */
    mapping: { type: Schema.Types.Mixed, default: {} },
    rows: { type: [importRowSchema], default: [] },
    // Preview stats (recomputed authoritatively on commit).
    parsedCount: { type: Number, default: 0 },
    newCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    invalidCount: { type: Number, default: 0 },
    // Commit results.
    importedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    committedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

importBatchSchema.index({ beneficiaryId: 1, createdAt: -1 });

export type ImportRow = InferSchemaType<typeof importRowSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ImportBatchDoc = InferSchemaType<typeof importBatchSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ImportBatch: Model<ImportBatchDoc> =
  mongoose.models?.ImportBatch ?? mongoose.model<ImportBatchDoc>("ImportBatch", importBatchSchema);

export default ImportBatch;
