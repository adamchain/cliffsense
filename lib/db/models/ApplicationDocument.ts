import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/* ----------------------------------------------------------------------------
 * A supporting document attached to a review Application (see Application.ts).
 * Kept separate from the beneficiary vault (Document.ts) because these are
 * admin-reviewed authorization proofs tied to an application, not a beneficiary
 * under someone's access grant. Bytes are stored in Mongo (like the vault); S3
 * can be a later swap behind the same upload API.
 * ------------------------------------------------------------------------- */

export const APPLICATION_DOC_TYPES = ["rep_payee_letter", "poa_financial"] as const;
export type ApplicationDocType = (typeof APPLICATION_DOC_TYPES)[number];

/** Human labels for the two accepted authorization documents. */
export const APPLICATION_DOC_LABELS: Record<ApplicationDocType, string> = {
  rep_payee_letter: "Representative Payee letter (SSA)",
  poa_financial: "Power of Attorney (financial affairs)",
};

export const APPLICATION_DOC_REVIEW = ["pending", "verified", "rejected"] as const;
export type ApplicationDocReview = (typeof APPLICATION_DOC_REVIEW)[number];

const applicationDocumentSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    docType: { type: String, enum: APPLICATION_DOC_TYPES, required: true },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "application/octet-stream" },
    sizeBytes: { type: Number, default: 0 },
    content: { type: Buffer, required: true },
    reviewStatus: {
      type: String,
      enum: APPLICATION_DOC_REVIEW,
      default: "pending",
      index: true,
    },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

applicationDocumentSchema.index({ applicationId: 1, createdAt: -1 });

export type ApplicationDocumentDoc = InferSchemaType<typeof applicationDocumentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ApplicationDocument: Model<ApplicationDocumentDoc> =
  mongoose.models?.ApplicationDocument ??
  mongoose.model<ApplicationDocumentDoc>("ApplicationDocument", applicationDocumentSchema);

export default ApplicationDocument;
