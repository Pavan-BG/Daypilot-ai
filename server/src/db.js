const mongoose = require("mongoose");
const { mongoUri } = require("./config/env");

async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB connected");
}

module.exports = { connectDb };
