import React from "react";
import { Box } from "@mui/material";
import AppShell from "../layouts/AppShell.jsx";
import JournalPanel from "../components/JournalPanel.jsx";

export default function Journal({ api, user, onRefresh }) {
  return (
    <AppShell api={api} user={user} onRefresh={onRefresh} title="Journal" subtitle="Notes">
      <Box sx={{ minWidth: 0 }}>
        <JournalPanel apiBase={api} />
      </Box>
    </AppShell>
  );
}