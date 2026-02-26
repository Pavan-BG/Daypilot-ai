import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";

export default function Login({ api }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
        "radial-gradient(circle at 20% 10%, rgba(102,103,171,0.16), transparent 42%)," +
        "radial-gradient(circle at 80% 20%, rgba(123,51,126,0.12), transparent 50%)," +
        "radial-gradient(circle at 50% 90%, rgba(66,13,75,0.10), transparent 60%)," +
        "linear-gradient(#07070A, #07070A)"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: "min(520px, 92vw)",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(18,10,26,0.85)",
          backdropFilter: "blur(12px)"
        }}
      >
        <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
          Life Planner
        </Typography>
        <Typography sx={{ opacity: 0.75, mb: 3 }}>
          Sign in with Google to access your private workspace.
        </Typography>

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => (window.location.href = `${api}/auth/google`)}
        >
          Continue with Google
        </Button>

        <Typography sx={{ mt: 2, opacity: 0.6, fontSize: 12 }}>
          Session-based login. No token juggling. Corporate compliance approves.
        </Typography>
      </Paper>
    </Box>
  );
}
