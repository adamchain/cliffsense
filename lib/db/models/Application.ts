import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/* ----------------------------------------------------------------------------
 * A review application for someone signing up to act on another person's behalf
 * (family caregiver, professional fiduciary, or nonprofit caseworker). Created
 * at registration for those roles; an admin reviews the applicant's supporting
 * document(s) and approves or rejects. `statusToken` backs a public link the
 * applicant can revisit any time to check status (persistent, not single-use —
 * mirrors Invite.token). Self-beneficiaries never get an Application.
 * ------------------------------------------------------------------------- */

export const APPLICATION_STATUSES = ["pending_review", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** How the applicant is authorized to act for the person they manage. */
export const APPLICATION_RELATIONSHIPS = [
  "representative_payee",
  "power_of_attorney",
  "family_caregiver",
  "nonprofit_caseworker",
  "other",
] as const;
export type ApplicationRelationship = (typeof APPLICATION_RELATIONSHIPS)[number];

/** Timeline event types, shown on the status page and admin detail. */
export const APPLICATION_EVENTS = [
  "submitted",
  "document_uploaded",
  "info_requested",
  "approved",
  "rejected",
] as const;
export type ApplicationEvent = (typeof APPLICATION_EVENTS)[number];

const timelineEventSchema = new Schema(
  {
    type: { type: String, enum: APPLICATION_EVENTS, required: true },
    at: { type: Date, required: true },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    /** Snapshot of the applicant's account type at submission. */
    accountType: {
      type: String,
      enum: ["family", "fiduciary", "nonprofit"],
      required: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "pending_review",
      index: true,
    },
    /** Who the applicant will manage, and under what authority. */
    actingFor: {
      personName: { type: String, default: "" },
      relationship: { type: String, enum: APPLICATION_RELATIONSHIPS, default: "other" },
    },
    /** Persistent token for the public status link (not single-use). */
    statusToken: { type: String, required: true, unique: true, index: true },
    timeline: { type: [timelineEventSchema], default: [] },
    /** Whether the applicant has completed the acting-for form + submitted. */
    submittedAt: { type: Date, default: null },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    /** Admin's note on the latest decision / info request, shown to the applicant. */
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const Application: Model<ApplicationDoc> =
  mongoose.models?.Application ?? mongoose.model<ApplicationDoc>("Application", applicationSchema);

export default Application;
