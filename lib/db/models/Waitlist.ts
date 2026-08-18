import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const waitlistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

waitlistSchema.index({ email: 1 });

type WaitlistDoc = InferSchemaType<typeof waitlistSchema>;
const Waitlist: Model<WaitlistDoc> =
  mongoose.models.Waitlist ?? mongoose.model("Waitlist", waitlistSchema);
export default Waitlist;
