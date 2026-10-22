import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SNT_PAYMENT_STATUSES, SNT_REVIEW_STATUSES } from "@/lib/snt/record";

/**
 * A manual Special Needs Trust disbursement. Status separates a request or
 * approval from a payment. This is not a feed from the trust's bank.
 */
const sntDisbursementSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trustName: { type: String, default: "", trim: true, maxlength: 200 },
    trusteeName: { type: String, default: "", trim: true, maxlength: 200 },
    financialInstitution: { type: String, default: "", trim: true, maxlength: 200 },
    paymentDate: { type: Date, default: null },
    amountCents: { type: Number, required: true, min: 0 },
    payee: { type: String, required: true, trim: true, maxlength: 200 },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: [...SNT_PAYMENT_STATUSES], required: true },
    reviewStatus: { type: String, enum: [...SNT_REVIEW_STATUSES], default: "none" },
    proofNote: { type: String, default: "", trim: true, maxlength: 1000 },
    documentIds: { type: [Schema.Types.ObjectId], ref: "VaultDocument", default: [] },
    followUpDate: { type: Date, default: null },
  },
  { timestamps: true },
);

sntDisbursementSchema.index({ beneficiaryId: 1, paymentDate: -1, createdAt: -1 });

export type SntDisbursementDoc = InferSchemaType<typeof sntDisbursementSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "SntDisbursement";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const SntDisbursement: Model<SntDisbursementDoc> = mongoose.model<SntDisbursementDoc>(
  MODEL_NAME,
  sntDisbursementSchema,
);

export default SntDisbursement;
