import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Monthly evidence-vault record for PA's 2027 Medicaid work/exemption rule.
 * This is a MyBenefitsPA record, not an official PA DHS form — DHS collects
 * compliance/exemption status at application and renewal (or on request), so
 * this exists to keep the supporting proof organized and ready month by month
 * rather than to be submitted itself. See Frank's Aug 24, 2026 spec.
 */
const activityLogRowSchema = new Schema(
  {
    datePeriod: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true }, // employer, school, program, org
    activity: { type: String, default: "", trim: true },
    hours: { type: Number, default: null },
    proofSaved: { type: Boolean, default: false },
  },
  { _id: false },
);

const submissionSchema = new Schema(
  {
    reason: {
      type: String,
      enum: ["application", "renewal", "information_request", "cure_appeal", null],
      default: null,
    },
    submittedDate: { type: Date, default: null },
    method: { type: String, enum: ["compass", "phone", "mail", "cao", "other", null], default: null },
    confirmationNumber: { type: String, default: "", trim: true },
    dhsStatus: { type: String, enum: ["accepted", "pending", "info_requested", null], default: null },
    followUpDate: { type: Date, default: null },
    nextAction: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false },
);

const noticeSchema = new Schema(
  {
    received: { type: Boolean, default: false },
    noticeDate: { type: Date, default: null },
    effectiveDate: { type: Date, default: null },
    appealDeadline: { type: Date, default: null },
    continuedBenefitDeadline: { type: Date, default: null },
    appealFiledDate: { type: Date, default: null },
    hearingType: { type: String, enum: ["telephone", "in_person", null], default: null },
    receiptSaved: { type: Boolean, default: false },
    reasonChallenged: {
      type: [String],
      enum: ["hours_miscounted", "proof_not_credited", "exemption_denied", "other"],
      default: [],
    },
    reasonChallengedOther: { type: String, default: "", trim: true },
    evidenceSaved: {
      type: [String],
      enum: ["notice", "activity_proof", "submission_receipts", "medical_exemption_proof"],
      default: [],
    },
  },
  { _id: false },
);

const PROOF_ITEM_IDS = [
  "pay_stubs",
  "timesheets",
  "employer_letter",
  "work_schedule",
  "school_enrollment",
  "training_attendance",
  "volunteer_log",
  "exemption_medical_caregiver",
  "dhs_notice",
  "other",
] as const;

const workRequirementRecordSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** "YYYY-MM" — one record per beneficiary per month. */
    month: { type: String, required: true, trim: true },

    medicaidCaseNumber: { type: String, default: "", trim: true },
    nextRenewalDate: { type: Date, default: null },
    caregiverName: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["hours_80", "income_580", "exemption", "need_help", null],
      default: null,
    },
    qualifyingActivity: {
      type: [String],
      enum: ["paid_work", "school", "training", "volunteer", "combination"],
      default: [],
    },
    exemptionReason: { type: String, default: "", trim: true, maxlength: 500 },
    exemptionProofSaved: { type: String, enum: ["yes", "no", "not_yet"], default: "not_yet" },

    activityLog: { type: [activityLogRowSchema], default: [] },
    totalRecordedHours: { type: Number, default: 0, min: 0 },
    hoursMet: { type: Boolean, default: false },
    usingIncomeOption: { type: Boolean, default: false },
    exemptionApplies: { type: Boolean, default: false },

    proofSaved: { type: [String], enum: PROOF_ITEM_IDS, default: [] },
    proofOtherNote: { type: String, default: "", trim: true, maxlength: 300 },
    missingProofNote: { type: String, default: "", trim: true, maxlength: 500 },
    missingProofOwner: { type: String, default: "", trim: true },
    missingProofByDate: { type: Date, default: null },

    submission: { type: submissionSchema, default: () => ({}) },
    notice: { type: noticeSchema, default: () => ({}) },
  },
  { timestamps: true },
);

workRequirementRecordSchema.index({ beneficiaryId: 1, month: 1 }, { unique: true });

export type WorkRequirementRecordDoc = InferSchemaType<typeof workRequirementRecordSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export { PROOF_ITEM_IDS };

const MODEL_NAME = "WorkRequirementRecord";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const WorkRequirementRecord: Model<WorkRequirementRecordDoc> = mongoose.model<WorkRequirementRecordDoc>(
  MODEL_NAME,
  workRequirementRecordSchema,
);

export default WorkRequirementRecord;
