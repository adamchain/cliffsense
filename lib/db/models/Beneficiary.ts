import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const benefitEnrollmentSchema = new Schema(
  {
    program: {
      type: String,
      enum: [
        "SSI",
        "SSDI",
        "SNAP",
        "Medicaid",
        "Section8",
        "TANF",
        "WIC",
        "LIHEAP",
        "ACA",
        "VA",
        "ABLE",
      ],
      required: true,
    },
    enrolledSince: { type: Date, default: null },
    /** Next agency renewal / recert / redetermination date (vital). */
    nextRenewalDate: { type: Date, default: null },
    contextData: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const beneficiarySchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isOwner: { type: Boolean, default: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    state: { type: String, default: "", trim: true, uppercase: true },
    county: { type: String, default: "", trim: true },
    householdSize: { type: Number, default: 1, min: 1 },
    benefitsEnrolled: { type: [benefitEnrollmentSchema], default: [] },
    /** systemKeys of bundled system thresholds the user has detached (opted out of). */
    detachedThresholdKeys: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type BeneficiaryDoc = InferSchemaType<typeof beneficiarySchema> & {
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = "Beneficiary";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const Beneficiary: Model<BeneficiaryDoc> = mongoose.model<BeneficiaryDoc>(
  MODEL_NAME,
  beneficiarySchema,
);

export default Beneficiary;
