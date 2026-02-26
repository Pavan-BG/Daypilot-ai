import React, { useMemo, useState } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AppShell from "../layouts/AppShell.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import TasksPanel from "../components/TasksPanel.jsx";
import UpcomingPanel from "../components/UpcomingPanel.jsx";
import WeatherPanel from "../components/WeatherPanel.jsx";

function greetingForHour(h) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user) {
  const raw = (user?.name || "").trim();
  if (!raw) return "";
  return raw.split(/\s+/)[0];
}

export default function Dashboard({ api, user, onRefresh }) {
  const [taskStats, setTaskStats] = useState(null); // {total, done, active}
  const [eventStats, setEventStats] = useState(null); // {total, today}

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const name = firstName(user);

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(
        new Date()
      );
    } catch {
      return "Today";
    }
  }, []);

  return (
    <AppShell api={api} user={user} onRefresh={onRefresh} title="Overview" subtitle="Daily">
      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        {/* Dashboard header */}
        <Paper
          sx={(t) => ({
            p: { xs: 2, sm: 2.5 },
            border: "1px solid",
            borderColor: "divider",
            background:
              t.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.16)}, ${alpha(
                    t.palette.secondary.main,
                    0.10
                  )})`
                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.10)}, ${alpha(
                    t.palette.secondary.main,
                    0.06
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
              <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                {greeting}
                {name ? `, ${name}` : ""} 👋
              </Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.4 }}>{todayLabel}</Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                label={
                  taskStats
                    ? `${taskStats.active} tasks active`
                    : "Tasks loading…"
                }
                variant="outlined"
              />
              <Chip
                label={
                  eventStats
                    ? `${eventStats.today} events today`
                    : "Events loading…"
                }
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Month calendar (lighter, dashboard layout) */}
        <Box sx={{ minWidth: 0 }}>
          <MonthCalendar apiBase={api} showSidePanel={false} />
        </Box>

        {/* Bottom: Tasks + widgets */}
        <Box
          sx={{
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 520px" },
            gap: { xs: 2, sm: 2.5 },
            alignItems: "start"
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <TasksPanel apiBase={api} onStatsChange={setTaskStats} />
          </Box>

          <Stack
            spacing={2}
            sx={{
              minWidth: 0,
              position: { lg: "sticky" },
              top: { lg: 88 },
              alignSelf: "start"
            }}
          >
            <UpcomingPanel apiBase={api} onStatsChange={setEventStats} />
            <WeatherPanel />
          </Stack>
        </Box>
      </Stack>
    </AppShell>
  );
}