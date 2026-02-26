import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { buildTheme } from "./theme";

const ThemeModeCtx = createContext(null);

function getInitialMode() {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark") return stored;

  // fallback to system preference
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => getInitialMode());

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

  // Helps native inputs/scrollbars pick correct palette in modern browsers
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeModeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeCtx.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeCtx);
  if (!ctx) {
    // defensive: avoids silent null crashes
    return { mode: "dark", toggleMode: () => {} };
  }
  return ctx;
}