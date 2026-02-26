const dotenv = require("dotenv");
dotenv.config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: must("MONGODB_URI"),
  sessionSecret: must("SESSION_SECRET"),
  frontendUrl: must("FRONTEND_URL"),
  google: {
    clientID: must("GOOGLE_CLIENT_ID"),
    clientSecret: must("GOOGLE_CLIENT_SECRET"),
    callbackURL: must("GOOGLE_CALLBACK_URL")
  }
};
