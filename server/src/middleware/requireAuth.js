function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Login required" } });
}

module.exports = { requireAuth };
