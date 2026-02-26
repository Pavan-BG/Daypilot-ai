const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    // simple MVP: completion tracked by YYYY-MM-DD strings
    completions: { type: [String], default: [] },
    archived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Habit", HabitSchema);