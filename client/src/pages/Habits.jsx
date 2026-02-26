import React from "react";
import { Box } from "@mui/material";
import AppShell from "../layouts/AppShell.jsx";
import HabitsPanel from "../components/HabitsPanel.jsx";

export default function Habits({ api, user, onRefresh }) {
  return (
    <AppShell api={api} user={user} onRefresh={onRefresh} title="Habits" subtitle="Tracker">
      <Box sx={{ minWidth: 0 }}>
        <HabitsPanel apiBase={api} />
      </Box>
    </AppShell>
  );
}