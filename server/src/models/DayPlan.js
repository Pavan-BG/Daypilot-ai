const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // stable client id (uuid)
    title: { type: String, required: true, trim: true, maxlength: 120 },
    startMin: { type: Number, required: true, min: 0, max: 1439 },
    durationMin: { type: Number, required: true, min: 5, max: 600 },
    source: { type: String, enum: ["manual", "task"], default: "manual" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    locked: { type: Boolean, default: false } // ✅ persist lock state
  },
  { _id: false }
);

const DayPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    dateKey: { type: String, required: true }, // YYYY-MM-DD
    blocks: { type: [BlockSchema], default: [] }
  },
  { timestamps: true }
);

DayPlanSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("DayPlan", DayPlanSchema);
