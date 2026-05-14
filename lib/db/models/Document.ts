import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const documentSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: [
        "award_letter",
        "income_verification",
        "renewal",
        "asset_statement",
        "correspondence",
        "other",
      ],
      default: "other",
    },
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

const VaultDocument: Model<DocumentDoc> =
  mongoose.models?.VaultDocument ??
  mongoose.model<DocumentDoc>("VaultDocument", documentSchema);

export default VaultDocument;
