import React, { useMemo, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TodayIcon from "@mui/icons-material/Today";

import AppShell from "../layouts/AppShell.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import DayPlanPanel from "../components/DayPlanPanel.jsx";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function prettyDate(ymd) {
  try {
    const [y, m, d] = String(ymd).split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(dt);
  } catch {
    return ymd || "—";
  }
}

export default function Planner({ api, user, onRefresh }) {
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayKey());

  const isToday = useMemo(() => selectedDateKey === todayKey(), [selectedDateKey]);
  const selectedLabel = useMemo(() => prettyDate(selectedDateKey), [selectedDateKey]);

  return (
    <AppShell api={api} user={user} onRefresh={onRefresh} title="Month View" subtitle="Planner">
      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        {/* Page header */}
        <Paper
          sx={(t) => ({
            p: { xs: 2, sm: 2.5 },
            border: "1px solid",
            borderColor: "divider",
            background:
              t.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.14)}, ${alpha(
                    t.palette.secondary.main,
                    0.08
                  )})`
                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha(
                    t.palette.secondary.main,
                    0.05
                  )})`
          })}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.15 }}>
                Planner
              </Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.35 }}>
                Pick a day on the calendar to edit events + build your day plan.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                variant="outlined"
                label={isToday ? `Selected: Today (${selectedLabel})` : `Selected: ${selectedDateKey} (${selectedLabel})`}
              />
              <Button
                size="small"
                variant="contained"
                startIcon={<TodayIcon />}
                onClick={() => setSelectedDateKey(todayKey())}
                disabled={isToday}
                sx={{ whiteSpace: "nowrap" }}
              >
                Jump to today
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Calendar + right-side panels (events + day plan) */}
        <Box sx={{ minWidth: 0 }}>
          <MonthCalendar
            apiBase={api}
            selectedDate={selectedDateKey}
            onSelectDate={(k) => setSelectedDateKey(k)}
            dayPlan={<DayPlanPanel apiBase={api} dateKey={selectedDateKey} />}
          />
        </Box>
      </Stack>
    </AppShell>
  );
}