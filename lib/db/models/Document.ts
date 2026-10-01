import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { VAULT_CATEGORY_IDS } from "@/lib/vault/categories";

const documentSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: [...VAULT_CATEGORY_IDS],
      default: "other",
    },
    /** Checklist row inside the folder, when the file fills a preset document type. */
    slot: { type: String, default: "", trim: true },
    /** When this document is a receipt paired to a bank transaction. */
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", default: null, index: true },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "application/octet-stream" },
    sizeBytes: { type: Number, default: 0 },
    content: { type: Buffer, required: true },
    scanStatus: {
      type: String,
      enum: ["pending", "clean", "flagged"],
      default: "clean",
    },
  },
  { timestamps: true },
);

documentSchema.index({ beneficiaryId: 1, category: 1, createdAt: -1 });

export type DocumentDoc = InferSchemaType<typeof documentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "VaultDocument";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const VaultDocument: Model<DocumentDoc> = mongoose.model<DocumentDoc>(MODEL_NAME, documentSchema);

export default VaultDocument;
