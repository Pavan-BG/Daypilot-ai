const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
  {
    startMin: { type: Number, required: true, min: 0, max: 1439 },   // minutes since 00:00
    durationMin: { type: Number, required: true, min: 5, max: 600 }, // minutes
    title: { type: String, required: true, trim: true, maxlength: 120 },

    source: { type: String, enum: ["task", "manual", "calendar"], default: "manual" },
    taskId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Task" },

    locked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const PlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    // Store date as local-day key to avoid timezone chaos
    // Format: YYYY-MM-DD
    date: { type: String, required: true, index: true },

    blocks: { type: [BlockSchema], default: [] }
  },
  { timestamps: true }
);

// One plan per user per day
PlanSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Plan", PlanSchema);
