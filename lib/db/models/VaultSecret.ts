import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A secure vault item: an account login or a wallet card (insurance, Medicaid,
 * Medicare, etc.). Sensitive fields (password, card/member numbers) live only
 * inside `dataEnc` — an AES-256-GCM blob (see lib/crypto/secret-box.ts) — and
 * are never stored or returned in plaintext except on an explicit reveal. The
 * plaintext columns here are display-only metadata safe to list.
 */
const vaultSecretSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["login", "card"], required: true, index: true },
    /** Display name, e.g. "SSA.gov account" or "Aetna insurance card". */
    label: { type: String, required: true, trim: true, maxlength: 200 },
    /** Login only: the sign-in URL (not secret). */
    url: { type: String, default: "", maxlength: 500 },
    /** Login only: username/email (not treated as secret, shown in list). */
    username: { type: String, default: "", maxlength: 200 },
    /** Card only: card category for grouping/icons. */
    cardCategory: {
      type: String,
      enum: ["insurance", "medicaid", "medicare", "pharmacy", "id", "other", ""],
      default: "",
    },
    /** Last 4 of the card/member number, safe to show as a hint. */
    hint: { type: String, default: "", maxlength: 8 },
    /** Non-sensitive note shown without a reveal. */
    notes: { type: String, default: "", maxlength: 2000 },
    /** Encrypted JSON blob of the sensitive fields (password, numbers, …). */
    dataEnc: { type: String, default: "" },
  },
  { timestamps: true },
);

vaultSecretSchema.index({ beneficiaryId: 1, kind: 1, updatedAt: -1 });

export type VaultSecretDoc = InferSchemaType<typeof vaultSecretSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "VaultSecret";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const VaultSecret: Model<VaultSecretDoc> = mongoose.model<VaultSecretDoc>(
  MODEL_NAME,
  vaultSecretSchema,
);

export default VaultSecret;
