import React from "react";
import { Box } from "@mui/material";
import AppShell from "../layouts/AppShell.jsx";
import GoalsPanel from "../components/GoalsPanel.jsx";

export default function Goals({ api, user, onRefresh }) {
  return (
    <AppShell api={api} user={user} onRefresh={onRefresh} title="Goals" subtitle="Progress">
      <Box sx={{ minWidth: 0 }}>
        <GoalsPanel apiBase={api} />
      </Box>
    </AppShell>
  );
}