const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    deadline: { type: Date, default: null },
    durationMin: { type: Number, default: 30, min: 5, max: 600 },
    category: { type: String, default: "General", maxlength: 50 },
    done: { type: Boolean, default: false },

    // ✅ NEW: schedule task to a specific day (YYYY-MM-DD)
    scheduledDate: { type: String, default: null, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
