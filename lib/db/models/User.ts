import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const notificationPrefsSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ["realtime", "daily", "weekly"],
      default: "daily",
    },
    alertTypes: {
      predictive: { type: Boolean, default: true },
      breach: { type: Boolean, default: true },
      trend: { type: Boolean, default: true },
    },
    email: { type: String, default: "" },
    // Extra recipients copied on every alert/digest, in addition to the primary address.
    additionalEmails: { type: [String], default: [] },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, required: true },
    emailVerified: { type: Date, default: null },
    accountType: {
      type: String,
      enum: ["beneficiary", "family", "fiduciary", "nonprofit"],
      required: true,
    },
    name: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null },
    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },
    isAdmin: { type: Boolean, default: false },
    // Account standing. "disabled" blocks all future sign-ins (enforced in auth).
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },
    onboardingStep: {
      type: String,
      enum: ["none", "profile", "beneficiary", "plaid", "benefits", "notifications", "complete"],
      default: "none",
    },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

const User: Model<UserDoc> =
  mongoose.models?.User ?? mongoose.model<UserDoc>("User", userSchema);

export default User;
