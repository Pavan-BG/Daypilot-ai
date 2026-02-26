import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Planner from "./pages/Planner.jsx";
import Habits from "./pages/Habits.jsx";
import Journal from "./pages/Journal.jsx";
import Goals from "./pages/Goals.jsx";

// Best-practice: allow env override but keep your existing default
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const r = await fetch(`${API}/auth/me`, { credentials: "include" });
    const data = await r.json().catch(() => ({}));
    setUser(data.user || null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  // You can swap this to a loader later; keeping behavior unchanged for safety
  if (loading) return null;

  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login api={API} />} />

      {/* Protected */}
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}