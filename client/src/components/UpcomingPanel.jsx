import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { apiGet } from "../services/api";

function fmt(dt) {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return String(dt);
  }
}

function looksLikeUrl(s) {
  return typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"));
}

function hostFromUrl(s) {
  try {
    const u = new URL(s);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function prettyCalendarLabel(c) {
  const s = (c?.summary || "").trim();
  if (!s) return "Calendar";
  if (s.includes("mycampus.iubh.de")) return "IU Campus (import)";
  if (looksLikeUrl(s)) {
    const h = hostFromUrl(s);
    return h ? `${h} (import)` : "Imported calendar";
  }
  return s.length > 34 ? s.slice(0, 34) + "…" : s;
}

function prettyMeta(e) {
  const time = fmt(e.start);
  const loc = (e.location || "").trim();
  if (!loc) return time;
  if (looksLikeUrl(loc)) {
    const h = hostFromUrl(loc);
    return h ? `${time} • Online (${h})` : `${time} • Online`;
  }
  return loc.length > 40 ? `${time} • ${loc.slice(0, 40)}…` : `${time} • ${loc}`;
}

// Local YYYY-MM-DD key
function localYmd(dateObj) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dateObj);
}
function dateKeyFromStart(start) {
  if (!start) return "";
  if (typeof start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start)) return start;
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "";
  return localYmd(d);
}

export default function UpcomingPanel({ apiBase, onStatsChange }) {
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [calendarId, setCalendarId] = useState("");
  const [days, setDays] = useState(30);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const primary = useMemo(() => calendars.find((c) => c.primary) || null, [calendars]);
  const selectedCalendar = calendars.find((c) => c.id === calendarId);

  async function loadCalendars() {
    const data = await apiGet(apiBase, "/api/calendar/calendars");
    if (data?.error) throw new Error(data.error.message || "Failed to load calendars");

    const list = data.calendars || [];
    setCalendars(list);

    const p = list.find((c) => c.primary);
    if (p && !calendarId) setCalendarId(p.id);
  }

  async function loadEvents(calIdOverride) {
    const calId = calIdOverride || calendarId || primary?.id;
    if (!calId) return;

    setLoading(true);
    setErr("");

    const url = `/api/calendar/upcoming?days=${days}&max=25&calendarId=${encodeURIComponent(calId)}`;
    const data = await apiGet(apiBase, url);

    if (data?.error) {
      setErr(data.error.message || "Failed to load events");
      setEvents([]);
    } else {
      setEvents(data.events || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadCalendars();
      } catch (e) {
        setErr(e?.message || "Calendar load failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (calendarId) loadEvents(calendarId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, days]);

  // push stats up to Dashboard header
  useEffect(() => {
    const todayKey = localYmd(new Date());
    const todayCount = events.filter((e) => dateKeyFromStart(e.start) === todayKey).length;
    onStatsChange?.({ total: events.length, today: todayCount });
  }, [events, onStatsChange]);

  return (
    <Paper
      sx={(t) => ({
        minWidth: 0,
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        background:
          t.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.10)}, ${alpha("#000000", 0.10)})`
            : `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.06)}, ${alpha("#FFFFFF", 0.70)})`
      })}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={950}>Upcoming</Typography>
          <Typography sx={{ opacity: 0.65, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedCalendar ? prettyCalendarLabel(selectedCalendar) : "Google Calendar"}
          </Typography>
        </Box>

        <Button size="small" variant="outlined" onClick={() => loadEvents()} disabled={loading} sx={{ whiteSpace: "nowrap" }}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 2, minWidth: 0 }}>
        <FormControl fullWidth sx={{ minWidth: 0 }}>
          <InputLabel id="cal-label">Calendar</InputLabel>
          <Select
            labelId="cal-label"
            label="Calendar"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            sx={{
              minWidth: 0,
              "& .MuiSelect-select": {
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }
            }}
            renderValue={(selected) => {
              const c = calendars.find((x) => x.id === selected);
              const label = c ? prettyCalendarLabel(c) : "Calendar";
              return (
                <Box sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c?.summary || label}>
                  {label}
                </Box>
              );
            }}
          >
            {calendars.map((c) => (
              <MenuItem key={c.id} value={c.id} title={c.summary}>
                {prettyCalendarLabel(c)}
                {c.primary ? " (Primary)" : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={days}
          exclusive
          onChange={(_e, v) => v && setDays(v)}
          size="small"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            borderRadius: 999,
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              borderRadius: 999,
              px: 1.4,
              py: 0.7,
              fontWeight: 900,
              textTransform: "none",
              minHeight: 36,
              whiteSpace: "nowrap"
            },
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "primary.main",
              color: "#fff"
            }
          }}
        >
          <ToggleButton value={7}>Next 7</ToggleButton>
          <ToggleButton value={30}>Next 30</ToggleButton>
          <ToggleButton value={365}>Next 365</ToggleButton>
        </ToggleButtonGroup>

        {err ? (
          <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
            <Typography sx={{ opacity: 0.85 }}>{err}</Typography>
            <Button sx={{ mt: 1 }} variant="contained" onClick={() => (window.location.href = `${apiBase}/auth/google`)}>
              Reconnect Google
            </Button>
          </Paper>
        ) : events.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
            <Typography fontWeight={950}>No events found</Typography>
            <Typography sx={{ opacity: 0.7, mt: 0.5, fontSize: 13 }}>
              Try “Next 365” or choose another calendar.
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderColor: "divider", overflow: "hidden" }}>
            <List
              disablePadding
              sx={{
                maxHeight: { xs: 320, lg: 420 },
                overflowY: "auto",
                overflowX: "hidden"
              }}
            >
              {events.map((e, idx) => (
                <ListItemButton
                  key={e.id}
                  component={e.link ? "a" : "div"}
                  href={e.link || undefined}
                  target={e.link ? "_blank" : undefined}
                  rel={e.link ? "noreferrer" : undefined}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderBottom: idx === events.length - 1 ? "none" : "1px solid",
                    borderColor: "divider",
                    alignItems: "flex-start",
                    gap: 1,
                    minWidth: 0
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={950} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.title}>
                      {e.title}
                    </Typography>
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>{prettyMeta(e)}</Typography>
                  </Box>

                  {e.link ? <OpenInNewIcon sx={{ opacity: 0.7, mt: 0.25 }} fontSize="small" /> : null}
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}