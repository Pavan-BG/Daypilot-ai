const express = require("express");
const { google } = require("googleapis");
const { requireAuth } = require("../middleware/requireAuth");
const User = require("../models/User");

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/calendar/upcoming?days=7&max=10&calendarId=primary
 * - days: 1..30
 * - max: 1..50
 * - calendarId: defaults to "primary"
 */
router.get("/upcoming", async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days || "7", 10), 30);
    const max = Math.min(parseInt(req.query.max || "10", 10), 50);
    const calendarId = req.query.calendarId || "primary";

    // Debug log so you can see auth + params in terminal
    console.log("CAL upcoming", {
      authed: req.isAuthenticated?.(),
      userId: req.user?.id,
      days,
      max,
      calendarId
    });

    const me = await User.findById(req.user.id);
    if (!me?.googleRefreshToken) {
      return res.status(400).json({
        error: { code: "NO_REFRESH_TOKEN", message: "Reconnect Google to enable Calendar access." }
      });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2.setCredentials({ refresh_token: me.googleRefreshToken });

    const cal = google.calendar({ version: "v3", auth: oauth2 });

    const timeMin = new Date();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const r = await cal.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: max,
      singleEvents: true,
      orderBy: "startTime"
    });

    const events = (r.data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || "(No title)",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || "",
      link: e.htmlLink || ""
    }));

    return res.json({ events });
  } catch (err) {
    const msg = err?.message || "Calendar API error";
    console.error("Calendar error:", msg);
    return res.status(400).json({
      error: { code: "CALENDAR_API_ERROR", message: msg }
    });
  }
});

/**
 * GET /api/calendar/calendars
 * Lists calendars available in the user's Google account.
 * Use this to find the right calendarId if primary is empty.
 */
router.get("/calendars", async (req, res) => {
  try {
    console.log("CAL calendars", { authed: req.isAuthenticated?.(), userId: req.user?.id });

    const me = await User.findById(req.user.id);
    if (!me?.googleRefreshToken) {
      return res.status(400).json({
        error: { code: "NO_REFRESH_TOKEN", message: "Reconnect Google to enable Calendar access." }
      });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2.setCredentials({ refresh_token: me.googleRefreshToken });

    const cal = google.calendar({ version: "v3", auth: oauth2 });
    const r = await cal.calendarList.list({ maxResults: 50 });

    const calendars = (r.data.items || []).map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: !!c.primary,
      accessRole: c.accessRole
    }));

    return res.json({ calendars });
  } catch (err) {
    const msg = err?.message || "Calendar API error";
    console.error("Calendar error:", msg);
    return res.status(400).json({
      error: { code: "CALENDAR_API_ERROR", message: msg }
    });
  }
});

router.get("/range", async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me?.googleRefreshToken) {
      return res.status(400).json({
        error: { code: "NO_REFRESH_TOKEN", message: "Reconnect Google to enable Calendar access." }
      });
    }

    const calendarId = req.query.calendarId || "primary";
    const timeMin = req.query.timeMin;
    const timeMax = req.query.timeMax;

    if (!timeMin || !timeMax) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "timeMin and timeMax are required." }
      });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2.setCredentials({ refresh_token: me.googleRefreshToken });

    const cal = google.calendar({ version: "v3", auth: oauth2 });

    const r = await cal.events.list({
      calendarId,
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: "startTime"
    });

    const events = (r.data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || "(No title)",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || "",
      link: e.htmlLink || ""
    }));

    res.json({ events });
  } catch (err) {
    const msg = err?.message || "Calendar API error";
    console.error("Calendar range error:", msg);
    return res.status(400).json({
      error: { code: "CALENDAR_API_ERROR", message: msg }
    });
  }
});


module.exports = router;
