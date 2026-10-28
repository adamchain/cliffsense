import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const benefitEnrollmentSchema = new Schema(
  {
    program: {
      type: String,
      enum: [
        "SSI",
        "SSDI",
        "DAC",
        "SNAP",
        "Medicaid",
        "MedicaidABD",
        "MedicaidMAGI",
        "MedicaidWaiver",
        "MAWD",
        "QMB",
        "ExtraHelp",
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
    /** "confirmed" (from a notice), "estimated", or "needs_confirmation". */
    renewalConfidence: { type: String, default: "needs_confirmation" },
    /** Next scheduled interim report (e.g. SNAP SAR) — never derived from the renewal date. */
    nextInterimReportDate: { type: Date, default: null },
    interimConfidence: { type: String, default: "needs_confirmation" },
    /** SNAP reporting category: sar | elderly_disabled_earned | esap | unknown. */
    reportingCategory: { type: String, default: null },
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
    /** SSDI Trial Work Period months the user has counted (0–9). */
    twpMonthsUsed: { type: Number, default: 0, min: 0, max: 9 },
    /**
     * Monthly impairment-related work expenses, in cents. Subtracted from earned
     * income before the one-half exclusion, and dollar-for-dollar from SGA.
     */
    irweMonthlyCents: { type: Number, default: 0, min: 0 },
    /** Answers for the gated 2026–27 SNAP/MAGI/immigrant policy screen. */
    policyScreen: { type: Schema.Types.Mixed, default: null },
    /** Case-opening answers from Benefit Monitor onboarding (authority, screening, identity extras). */
    opening: { type: Schema.Types.Mixed, default: null },
    /**
     * Optional Special Needs Trust profile. The legal trustee and the financial
     * institution are separate. This does not connect to the trust's bank.
     */
    sntProfile: {
      type: new Schema(
        {
          trustName: { type: String, default: "", trim: true, maxlength: 200 },
          trusteeName: { type: String, default: "", trim: true, maxlength: 200 },
          trusteeContact: { type: String, default: "", trim: true, maxlength: 300 },
          financialInstitution: { type: String, default: "", trim: true, maxlength: 200 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
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
