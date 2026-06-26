import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A browser/device Web Push subscription (one per installed PWA / browser).
 * `endpoint` is globally unique per subscription; we upsert on it so the same
 * device re-subscribing doesn't create duplicates. Expired subscriptions are
 * deleted lazily by the sender when the push service returns 404/410.
 */
const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

export type PushSubscriptionDoc = InferSchemaType<typeof pushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const PushSubscription: Model<PushSubscriptionDoc> =
  mongoose.models?.PushSubscription ??
  mongoose.model<PushSubscriptionDoc>("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
