import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Single-use tokens for email verification, password reset, and login codes. */
const authTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: {
      type: String,
      enum: ["email_verify", "password_reset", "login_code"],
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type AuthTokenDoc = InferSchemaType<typeof authTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

const AuthToken: Model<AuthTokenDoc> =
  mongoose.models?.AuthToken ?? mongoose.model<AuthTokenDoc>("AuthToken", authTokenSchema);

export default AuthToken;
