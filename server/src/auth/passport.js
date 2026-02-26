const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { google } = require("../config/env");

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u || false);
  } catch (e) {
    done(e);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: google.clientID,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackURL,
      passReqToCallback: true
    },
    async (_req, accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || "";
        const name = profile.displayName || "";
        const avatarUrl = profile.photos?.[0]?.value || "";

        let user = await User.findOne({ googleId });
        if (!user) {
          user = await User.create({ googleId, email, name, avatarUrl });
        } else {
          user.email = email || user.email;
          user.name = name || user.name;
          user.avatarUrl = avatarUrl || user.avatarUrl;
        }

        // Store refresh token when Google provides it
        if (refreshToken) {
          user.googleRefreshToken = refreshToken;
        }

        await user.save();
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);


module.exports = passport;
