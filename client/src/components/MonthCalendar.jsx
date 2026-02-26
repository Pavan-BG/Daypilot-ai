// client/src/components/MonthCalendar.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { apiGet } from "../services/api";

// Monday-start calendar grid helpers
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  return addDays(x, diff);
}
function endOfWeekSunday(d) {
  const s = startOfWeekMonday(d);
  return addDays(s, 6);
}
function fmtMonthTitle(d) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}
function fmtDayHeader(d) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(d);
}
function fmtTime(dt) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
      new Date(dt)
    );
  } catch {
    return "";
  }
}

// Local YYYY-MM-DD key without UTC shifting
function localDateKeyFromDate(dateObj) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(dateObj);
}

function parseYmdToLocalDate(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function dateKeyFromEventStart(start) {
  if (!start) return "";
  if (typeof start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start)) return start; // all-day
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "";
  return localDateKeyFromDate(d);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Props:
 * - apiBase (string) REQUIRED
 * - selectedDate (YYYY-MM-DD) optional controlled selection
 * - onSelectDate(YYYY-MM-DD) optional callback when a day is selected
 * - dayPlan (ReactNode) optional: rendered UNDER the events panel on the right
 * - showSidePanel (boolean) optional: default true; when false, render compact “dashboard” layout
 */
export default function MonthCalendar({
  apiBase,
  selectedDate,
  onSelectDate,
  dayPlan = null,
  showSidePanel = true
}) {
  const [calendars, setCalendars] = useState([]);
  const [calendarId, setCalendarId] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const [selectedDay, setSelectedDay] = useState(() => {
    const fromProp = parseYmdToLocalDate(selectedDate);
    return fromProp || new Date();
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // controlled selection: parent -> calendar
  useEffect(() => {
    const fromProp = parseYmdToLocalDate(selectedDate);
    if (!fromProp) return;

    if (!isSameDay(fromProp, selectedDay)) {
      setSelectedDay(fromProp);
      setMonthCursor(new Date(fromProp.getFullYear(), fromProp.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const primary = useMemo(() => calendars.find((c) => c.primary) || null, [calendars]);

  const gridRange = useMemo(() => {
    const mStart = startOfMonth(monthCursor);
    const mEnd = endOfMonth(monthCursor);
    const gridStart = startOfWeekMonday(mStart);
    const gridEnd = endOfWeekSunday(mEnd);
    return { mStart, mEnd, gridStart, gridEnd };
  }, [monthCursor]);

  const gridDays = useMemo(() => {
    const days = [];
    const { gridStart, gridEnd } = gridRange;
    let cur = new Date(gridStart);
    while (cur <= gridEnd) {
      days.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return days;
  }, [gridRange]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const key = dateKeyFromEventStart(e.start);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const aT = new Date(a.start).getTime();
        const bT = new Date(b.start).getTime();
        if (Number.isNaN(aT) || Number.isNaN(bT)) return 0;
        return aT - bT;
      });
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const selectedKey = useMemo(() => localDateKeyFromDate(selectedDay), [selectedDay]);
  const selectedEvents = useMemo(
    () => eventsByDay.get(selectedKey) || [],
    [eventsByDay, selectedKey]
  );

  async function loadCalendars() {
    const data = await apiGet(apiBase, "/api/calendar/calendars");
    if (data?.error) throw new Error(data.error.message || "Failed to load calendars");
    const list = data.calendars || [];
    setCalendars(list);

    const p = list.find((c) => c.primary);
    setCalendarId((prev) => prev || p?.id || list?.[0]?.id || "primary");
  }

  async function loadRangeEvents({ calendarId: calId, timeMin, timeMax }) {
    setLoading(true);
    setErr("");

    const url =
      `/api/calendar/range?calendarId=${encodeURIComponent(calId || "primary")}` +
      `&timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}`;

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
    if (!calendarId) return;

    const { gridStart, gridEnd } = gridRange;

    const timeMin = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate(),
      0,
      0,
      0,
      0
    ).toISOString();

    const timeMaxDate = addDays(
      new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate(), 0, 0, 0, 0),
      1
    );
    const timeMax = timeMaxDate.toISOString();

    loadRangeEvents({ calendarId, timeMin, timeMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, gridRange.gridStart, gridRange.gridEnd]);

  const selectedCalendar = calendars.find((c) => c.id === calendarId) || primary;

  function calendarLabel(c) {
    const s = (c?.summary || "").trim();
    if (!s) return "Calendar";
    return s.length > 36 ? s.slice(0, 36) + "…" : s;
  }

  function isAllDay(e) {
    return typeof e.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.start);
  }

  function dayCellEventCount(day) {
    const key = localDateKeyFromDate(day);
    return (eventsByDay.get(key) || []).length;
  }

  function renderDots(count) {
    const dots = Math.min(count, 3);
    return (
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
        {Array.from({ length: dots }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "999px",
              backgroundColor: "primary.main",
              opacity: 0.9
            }}
          />
        ))}
        {count > 3 ? (
          <Typography sx={{ fontSize: 11, opacity: 0.75, ml: 0.5 }}>+{count - 3}</Typography>
        ) : null}
      </Stack>
    );
  }

  function handleSelectDay(day) {
    setSelectedDay(day);
    onSelectDate?.(localDateKeyFromDate(day));
  }

  const splitColumns = showSidePanel
    ? {
        xs: "1fr",
        lg: "minmax(560px, 1fr) 520px",
        xl: "720px minmax(0, 1fr)"
      }
    : "1fr";

  return (
    <Box
      sx={{
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: splitColumns,
        gap: { xs: 2, sm: 2.5 },
        alignItems: "start"
      }}
    >
      {/* LEFT: Month Grid */}
      <Paper
        sx={{
          p: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          minWidth: 0
        }}
      >
        {/* Header controls */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 1.75, minWidth: 0 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={950} sx={{ fontSize: 18 }}>
              {fmtMonthTitle(monthCursor)}
            </Typography>
            <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
              {loading ? "Syncing events…" : "Click a day to view details"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexWrap: "wrap", rowGap: 1 }}>
            <FormControl size="small" sx={{ minWidth: { xs: 200, sm: 280 }, maxWidth: 360 }}>
              <InputLabel id="mc-cal-label">Calendar</InputLabel>
              <Select
                labelId="mc-cal-label"
                label="Calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                sx={{
                  "& .MuiSelect-select": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }
                }}
                renderValue={(selected) => {
                  const c = calendars.find((x) => x.id === selected);
                  return (
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c?.summary || ""}>
                      {calendarLabel(c || selectedCalendar)}
                    </Box>
                  );
                }}
              >
                {calendars.map((c) => (
                  <MenuItem key={c.id} value={c.id} title={c.summary}>
                    {calendarLabel(c)}
                    {c.primary ? " (Primary)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton
              onClick={() => setMonthCursor((d) => addMonths(d, -1))}
              size="small"
              sx={{ border: "1px solid", borderColor: "divider" }}
              aria-label="previous month"
            >
              <ChevronLeftIcon />
            </IconButton>

            <IconButton
              onClick={() => setMonthCursor((d) => addMonths(d, 1))}
              size="small"
              sx={{ border: "1px solid", borderColor: "divider" }}
              aria-label="next month"
            >
              <ChevronRightIcon />
            </IconButton>

            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon />}
              sx={{ whiteSpace: "nowrap" }}
              onClick={() => {
                const now = new Date();
                setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                handleSelectDay(now);
              }}
            >
              Today
            </Button>
          </Stack>
        </Stack>

        {/* Weekday header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1, mb: 1 }}>
          {WEEKDAYS.map((w) => (
            <Typography key={w} sx={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>
              {w}
            </Typography>
          ))}
        </Box>

        {/* Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1, minWidth: 0 }}>
          {gridDays.map((day) => {
            const inMonth = day.getMonth() === monthCursor.getMonth();
            const count = dayCellEventCount(day);
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());

            return (
              <Box
                key={day.toISOString()}
                onClick={() => handleSelectDay(day)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelectDay(day);
                }}
                sx={(t) => ({
                  cursor: "pointer",
                  userSelect: "none",
                  minHeight: { xs: 72, sm: 92 },
                  p: 1.1,
                  // ✅ IMPORTANT: use px string so it does NOT scale with theme.shape.borderRadius
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: isSelected ? alpha(t.palette.primary.main, 0.55) : "divider",
                  backgroundColor: isSelected
                    ? alpha(t.palette.primary.main, 0.12)
                    : inMonth
                    ? t.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.03)
                      : alpha("#000000", 0.02)
                    : t.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.015)
                    : alpha("#000000", 0.012),
                  overflow: "hidden",
                  transition: "transform 140ms ease, background-color 140ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    backgroundColor: isSelected
                      ? alpha(t.palette.primary.main, 0.14)
                      : t.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.045)
                      : alpha("#000000", 0.03)
                  },
                  outline: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minWidth: 0
                })}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
                  {/* ✅ Date badge keeps number visually inside the shape always */}
                  <Box
                    sx={(t) => ({
                      width: 28,
                      height: 28,
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: isSelected
                        ? alpha(t.palette.primary.main, 0.18)
                        : t.palette.mode === "dark"
                        ? alpha("#FFFFFF", 0.03)
                        : alpha("#000000", 0.03),
                      border: "1px solid",
                      borderColor: alpha(t.palette.divider, 0.9),
                      opacity: inMonth ? 1 : 0.6
                    })}
                  >
                    <Typography sx={{ fontWeight: 950, fontSize: 13, lineHeight: 1 }}>
                      {day.getDate()}
                    </Typography>
                  </Box>

                  {isToday ? (
                    <Box
                      sx={(t) => ({
                        px: 0.8,
                        py: 0.3,
                        borderRadius: "999px",
                        fontSize: 11,
                        fontWeight: 950,
                        border: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.55),
                        color: "primary.main",
                        opacity: 0.95
                      })}
                    >
                      Today
                    </Box>
                  ) : null}
                </Stack>

                {count > 0 ? renderDots(count) : <Box sx={{ height: 14 }} />}
              </Box>
            );
          })}
        </Box>

        {/* Error */}
        {err ? (
          <Paper variant="outlined" sx={{ mt: 2, p: 2, borderColor: "divider" }}>
            <Typography fontWeight={950}>Calendar error</Typography>
            <Typography sx={{ opacity: 0.75, mt: 0.5, fontSize: 13 }}>{err}</Typography>
            <Button sx={{ mt: 1.25 }} variant="contained" onClick={() => (window.location.href = `${apiBase}/auth/google`)}>
              Reconnect Google
            </Button>
          </Paper>
        ) : null}

        {/* Dashboard compact preview when side panel is disabled */}
        {!showSidePanel ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography fontWeight={950} sx={{ mb: 0.5 }}>
              {fmtDayHeader(selectedDay)}
            </Typography>
            <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1.5 }}>
              {selectedEvents.length
                ? `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""}`
                : "No events for this day"}
            </Typography>

            {selectedEvents.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
                <Typography fontWeight={950}>All clear.</Typography>
                <Typography sx={{ opacity: 0.75, mt: 0.5, fontSize: 13 }}>
                  Perfect day to pretend you’re “strategizing”.
                </Typography>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ borderColor: "divider", overflow: "hidden" }}>
                <List disablePadding>
                  {selectedEvents.slice(0, 3).map((e, idx) => {
                    const timeLabel = isAllDay(e) ? "All day" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
                    const secondary = e.location ? `${timeLabel} • ${e.location}` : timeLabel;

                    return (
                      <ListItemButton
                        key={e.id || `${idx}-${e.title}`}
                        component={e.link ? "a" : "div"}
                        href={e.link || undefined}
                        target={e.link ? "_blank" : undefined}
                        rel={e.link ? "noreferrer" : undefined}
                        sx={{
                          px: 2,
                          py: 1.25,
                          borderBottom: idx === Math.min(3, selectedEvents.length) - 1 ? "none" : "1px solid",
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
                          <Typography sx={{ opacity: 0.75, fontSize: 12 }}>{secondary}</Typography>
                        </Box>

                        {e.link ? <OpenInNewIcon sx={{ opacity: 0.7, mt: 0.25 }} fontSize="small" /> : null}
                      </ListItemButton>
                    );
                  })}
                </List>

                {selectedEvents.length > 3 ? (
                  <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                      +{selectedEvents.length - 3} more event(s)
                    </Typography>
                  </Box>
                ) : null}
              </Paper>
            )}
          </>
        ) : null}
      </Paper>

      {/* RIGHT: Events + Day Plan stacked */}
      {showSidePanel ? (
        <Stack
          spacing={2}
          sx={{
            minWidth: 0,
            position: { lg: "sticky" },
            top: { lg: 88 },
            alignSelf: "start"
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid", borderColor: "divider", minWidth: 0 }}>
            <Typography fontWeight={950} sx={{ mb: 0.5 }}>
              {fmtDayHeader(selectedDay)}
            </Typography>
            <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1.5 }}>
              {selectedEvents.length
                ? `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""}`
                : "No events for this day"}
            </Typography>

            {selectedEvents.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
                <Typography fontWeight={950}>All clear.</Typography>
                <Typography sx={{ opacity: 0.75, mt: 0.5, fontSize: 13 }}>
                  Perfect day to pretend you’re “strategizing”.
                </Typography>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ borderColor: "divider", overflow: "hidden" }}>
                <List disablePadding sx={{ maxHeight: { xs: 360, lg: 420 }, overflowY: "auto", overflowX: "hidden" }}>
                  {selectedEvents.map((e, idx) => {
                    const timeLabel = isAllDay(e) ? "All day" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
                    const secondary = e.location ? `${timeLabel} • ${e.location}` : timeLabel;

                    return (
                      <ListItemButton
                        key={e.id || `${idx}-${e.title}`}
                        component={e.link ? "a" : "div"}
                        href={e.link || undefined}
                        target={e.link ? "_blank" : undefined}
                        rel={e.link ? "noreferrer" : undefined}
                        sx={{
                          px: 2,
                          py: 1.25,
                          borderBottom: idx === selectedEvents.length - 1 ? "none" : "1px solid",
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
                          <Typography sx={{ opacity: 0.75, fontSize: 12 }}>{secondary}</Typography>
                        </Box>

                        {e.link ? <OpenInNewIcon sx={{ opacity: 0.7, mt: 0.25 }} fontSize="small" /> : null}
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
            )}
          </Paper>

          {dayPlan ? <Box sx={{ minWidth: 0 }}>{dayPlan}</Box> : null}
        </Stack>
      ) : null}
    </Box>
  );
}