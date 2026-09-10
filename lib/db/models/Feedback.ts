import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    name: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    path: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

feedbackSchema.index({ createdAt: -1 });

type FeedbackDoc = InferSchemaType<typeof feedbackSchema>;
const Feedback: Model<FeedbackDoc> =
  mongoose.models.Feedback ?? mongoose.model("Feedback", feedbackSchema);
export default Feedback;
