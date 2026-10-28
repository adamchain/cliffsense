import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A custom, user-defined workspace attached to a beneficiary — anything that
 * doesn't fit the benefit-program structure (nonprofit house management,
 * ordering a custom wheelchair, a move, etc.). Each project carries its own
 * checklist, free-form notes, and links to vault documents so the whole effort
 * lives in one place.
 */
const checklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    done: { type: Boolean, default: false },
    dueAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: ["active", "done", "archived"], default: "active", index: true },
    /** A small accent color for the card, e.g. "#7b61c9". */
    color: { type: String, default: "#3b82c4" },
    checklist: { type: [checklistItemSchema], default: [] },
    /** Free-form notes (plain text / light markdown). */
    notes: { type: String, default: "", maxlength: 20000 },
    /** Vault documents attached to this project. */
    linkedDocumentIds: { type: [Schema.Types.ObjectId], ref: "VaultDocument", default: [] },
  },
  { timestamps: true },
);

projectSchema.index({ beneficiaryId: 1, status: 1, updatedAt: -1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "Project";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const Project: Model<ProjectDoc> = mongoose.model<ProjectDoc>(MODEL_NAME, projectSchema);

export default Project;
