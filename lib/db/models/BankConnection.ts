import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const accountSchema = new Schema(
  {
    plaidAccountId: { type: String, required: true },
    name: { type: String, default: "" },
    mask: { type: String, default: "" },
    type: { type: String, default: "" },
    subtype: { type: String, default: "" },
    currentBalanceCents: { type: Number, default: 0 },
    availableBalanceCents: { type: Number, default: 0 },
  },
  { _id: false },
);

const bankConnectionSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    plaidItemId: { type: String, required: true, unique: true },
    plaidAccessTokenEncrypted: { type: String, required: true },
    plaidInstitutionId: { type: String, default: "" },
    institutionName: { type: String, default: "" },
    accounts: { type: [accountSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "login_required", "error", "disconnected"],
      default: "active",
    },
    lastSyncAt: { type: Date, default: null },
    syncCursor: { type: String, default: "" },
  },
  { timestamps: true },
);

bankConnectionSchema.index({ beneficiaryId: 1, plaidItemId: 1 });

export type BankConnectionDoc = InferSchemaType<typeof bankConnectionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const BankConnection: Model<BankConnectionDoc> =
  mongoose.models?.BankConnection ??
  mongoose.model<BankConnectionDoc>("BankConnection", bankConnectionSchema);

export default BankConnection;
