import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const beneficiaryAccessSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["owner", "co_manager", "viewer"],
      required: true,
    },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invitedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

beneficiaryAccessSchema.index({ beneficiaryId: 1, userId: 1 }, { unique: true });

export type BeneficiaryAccessDoc = InferSchemaType<typeof beneficiaryAccessSchema> & {
  _id: mongoose.Types.ObjectId;
};

const BeneficiaryAccess: Model<BeneficiaryAccessDoc> =
  mongoose.models?.BeneficiaryAccess ??
  mongoose.model<BeneficiaryAccessDoc>("BeneficiaryAccess", beneficiaryAccessSchema);

export default BeneficiaryAccess;
