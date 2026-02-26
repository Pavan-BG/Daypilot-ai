const mongoose = require("mongoose");

const JournalEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    dateKey: { type: String, required: true }, // YYYY-MM-DD
    title: { type: String, default: "", trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 5000 }
  },
  { timestamps: true }
);

JournalEntrySchema.index({ userId: 1, dateKey: -1 });

module.exports = mongoose.model("JournalEntry", JournalEntrySchema);