import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A to-do or reminder attached to a beneficiary. A "task" is a checkable item;
 * a "reminder" is a time-based nudge. Both can recur: when a recurring item is
 * completed we roll `dueAt` forward to the next occurrence instead of closing
 * it (see lib/tasks/recurrence.ts). Recurrence is stored as a compact rule so a
 * single document represents the whole series.
 */
const recurrenceSchema = new Schema(
  {
    freq: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    /** Repeat every N units of `freq` (every 2 weeks, etc). */
    interval: { type: Number, default: 1, min: 1, max: 365 },
    /** Optional end date; after this the series stops recurring. */
    until: { type: Date, default: null },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["task", "reminder"], default: "task", index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    notes: { type: String, default: "", maxlength: 4000 },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    status: { type: String, enum: ["open", "done", "dismissed"], default: "open", index: true },
    /** When the item is due / when to remind. Null = someday / no date. */
    dueAt: { type: Date, default: null, index: true },
    allDay: { type: Boolean, default: true },
    /** Null = one-off. Present = recurring series. */
    recurrence: { type: recurrenceSchema, default: null },
    /** Optional link to a benefit program (e.g. "SNAP") for context/filtering. */
    linkedProgram: { type: String, default: "" },
    remindViaEmail: { type: Boolean, default: false },
    /** Guards against sending the same due reminder twice. */
    lastNotifiedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    /** Number of times a recurring item has rolled forward. */
    completedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ beneficiaryId: 1, status: 1, dueAt: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MODEL_NAME = "Task";
if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const Task: Model<TaskDoc> = mongoose.model<TaskDoc>(MODEL_NAME, taskSchema);

export default Task;
