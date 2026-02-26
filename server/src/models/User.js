const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, index: true, required: true },
    email: { type: String, index: true },
    name: { type: String },
    avatarUrl: { type: String },

    // for Calendar access (offline)
    googleRefreshToken: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
