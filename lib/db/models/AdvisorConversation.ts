import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A saved Advisor chat. Scoped to the user (the advisor answers from the user's
 * active beneficiary, but the thread belongs to the person who had it).
 * Messages are embedded — threads are bounded (each message is capped at a few
 * KB and the advisor sends at most 40 per request), so a single document stays
 * well under Mongo's limit and reads/writes atomically.
 */
const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Beneficiary whose context the chat was about, when known. */
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", default: null, index: true },
    title: { type: String, default: "New chat", maxlength: 200 },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });

export type AdvisorConversationDoc = InferSchemaType<typeof conversationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "AdvisorConversation";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const AdvisorConversation: Model<AdvisorConversationDoc> = mongoose.model<AdvisorConversationDoc>(
  MODEL_NAME,
  conversationSchema,
);

export default AdvisorConversation;
