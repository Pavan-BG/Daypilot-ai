import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Button, Paper, Typography } from "@mui/material";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Planner from "./pages/Planner.jsx";
import Habits from "./pages/Habits.jsx";
import Journal from "./pages/Journal.jsx";
import Goals from "./pages/Goals.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import HomeInfo from "./pages/HomeInfo.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");

  async function refresh() {
    setLoading(true);
    setBootError("");

    try {
      const r = await fetch(`${API}/auth/me`, { credentials: "include" });

      // If backend is up but route not found, show it clearly
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`Auth check failed (${r.status}). ${text || ""}`.trim());
      }

      const data = await r.json().catch(() => ({}));
      setUser(data.user || null);
    } catch (e) {
      setUser(null);
      setBootError(e?.message || "Failed to reach backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Typography sx={{ opacity: 0.8 }}>Loading…</Typography>
      </Box>
    );
  }

  // Show a helpful screen instead of blank when backend/env is wrong
  if (bootError) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", maxWidth: 680 }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>
            App couldn’t reach the backend
          </Typography>
          <Typography sx={{ opacity: 0.75, mb: 2 }}>
            {bootError}
          </Typography>
          <Typography sx={{ opacity: 0.7, mb: 2, fontSize: 13 }}>
            Current API base: <b>{API}</b>
          </Typography>
          <Button variant="contained" onClick={refresh}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/info" element={<HomeInfo />} />
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <HomeInfo showLogin api={API} />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard api={API} user={user} onRefresh={refresh} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/planner"
        element={user ? <Planner api={API} user={user} onRefresh={refresh} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/habits"
        element={user ? <Habits api={API} user={user} onRefresh={refresh} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/journal"
        element={user ? <Journal api={API} user={user} onRefresh={refresh} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/goals"
        element={user ? <Goals api={API} user={user} onRefresh={refresh} /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/info"} replace />} />
    </Routes>
  );
}