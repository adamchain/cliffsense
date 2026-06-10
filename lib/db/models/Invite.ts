import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const inviteSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["co_manager", "viewer"], required: true },
    token: { type: String, required: true, unique: true, index: true },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    acceptedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export type InviteDoc = InferSchemaType<typeof inviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Invite: Model<InviteDoc> =
  mongoose.models?.Invite ?? mongoose.model<InviteDoc>("Invite", inviteSchema);

export default Invite;
