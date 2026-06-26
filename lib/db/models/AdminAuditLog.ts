import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/* ----------------------------------------------------------------------------
 * Dedicated, append-only audit trail for internal admin/back-office actions.
 * Kept separate from the user-facing ActivityLog so corporate oversight (who
 * changed/impersonated whom, and when) is isolated and easy to review/retain.
 * ------------------------------------------------------------------------- */

export const ADMIN_AUDIT_ACTIONS = [
  "grant_admin",
  "revoke_admin",
  "disable_user",
  "enable_user",
  "start_impersonation",
  "stop_impersonation",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

const adminAuditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, default: "" },
    action: { type: String, enum: ADMIN_AUDIT_ACTIONS, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    targetEmail: { type: String, default: "" },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminAuditLogSchema.index({ targetUserId: 1, createdAt: -1 });
adminAuditLogSchema.index({ createdAt: -1 });

export type AdminAuditLogDoc = InferSchemaType<typeof adminAuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

const AdminAuditLog: Model<AdminAuditLogDoc> =
  mongoose.models?.AdminAuditLog ??
  mongoose.model<AdminAuditLogDoc>("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
