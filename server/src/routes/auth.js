const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.readonly"
    ],
    accessType: "offline",
    prompt: "consent"
  })
);


router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/` }),
  (_req, res) => res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
);

router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const u = req.user;
    return res.json({ user: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl } });
  }
  return res.json({ user: null });
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => res.json({ ok: true }));
  });
});

module.exports = router;
