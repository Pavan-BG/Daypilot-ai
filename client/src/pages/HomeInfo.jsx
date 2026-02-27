import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const HomeInfo = () => (
  <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#07070A" }}>
    <Paper sx={{ p: 4, maxWidth: 700, borderRadius: 2, background: "rgba(18,10,26,0.92)", color: "#fff" }}>
      <Typography variant="h3" fontWeight={900} sx={{ mb: 2 }}>
        Welcome to DayPilot AI
      </Typography>
      <Typography sx={{ mb: 2, fontSize: 18 }}>
        DayPilot AI is your intelligent daily planner and productivity assistant. Organize your tasks, track your habits, set goals, and journal your progress—all in one secure, private workspace.
      </Typography>
      <Typography sx={{ mb: 2 }}>
        <b>Features:</b>
        <ul>
          <li>Smart daily, weekly, and monthly planning</li>
          <li>Task and goal management</li>
          <li>Habit tracking</li>
          <li>Personal journaling</li>
          <li>Weather and calendar integration</li>
          <li>Secure Google login—your data stays private</li>
        </ul>
      </Typography>
      <Typography sx={{ mb: 2 }}>
        <b>Privacy & Security:</b> We respect your privacy. Your data is never sold or shared. See our <a href="/privacy" style={{ color: "#90caf9" }}>Privacy Policy</a> and <a href="/terms" style={{ color: "#90caf9" }}>Terms of Service</a>.
      </Typography>
      <Typography sx={{ mb: 2 }}>
        <b>Contact:</b> For support or questions, email <a href="mailto:ssspriyamoru@gmail.com" style={{ color: "#90caf9" }}>ssspriyamoru@gmail.com</a>.
      </Typography>
    </Paper>
  </Box>
);

export default HomeInfo;
