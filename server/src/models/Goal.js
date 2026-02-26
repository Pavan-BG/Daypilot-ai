const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    targetDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ["active", "done"], default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);