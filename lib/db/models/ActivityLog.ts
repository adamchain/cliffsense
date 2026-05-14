import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const activityLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", default: null, index: true },
    sessionId: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "auth",
        "account",
        "beneficiary",
        "bank",
        "transaction",
        "threshold",
        "alert",
        "vault",
        "advisor",
        "export",
        "admin",
        "recurring",
      ],
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    resourceType: { type: String, default: "" },
    resourceId: { type: String, default: "" },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    geoCountry: { type: String, default: "" },
    geoRegion: { type: String, default: "" },
    severity: {
      type: String,
      enum: ["info", "warning", "security"],
      default: "info",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ beneficiaryId: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const ActivityLog: Model<ActivityLogDoc> =
  mongoose.models?.ActivityLog ??
  mongoose.model<ActivityLogDoc>("ActivityLog", activityLogSchema);

export default ActivityLog;
