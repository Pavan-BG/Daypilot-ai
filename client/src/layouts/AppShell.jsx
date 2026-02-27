import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { NavLink } from "react-router-dom";
import { useThemeMode } from "../theme/ThemeModeProvider.jsx";

const drawerW = 280;

export default function AppShell({ api, user, onRefresh, title, subtitle, children }) {
  const { mode, toggleMode } = useThemeMode();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  async function logout() {
    await fetch(`${api}/auth/logout`, { method: "POST", credentials: "include" });
    await onRefresh();
  }

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar />

      <Box sx={{ p: 2 }}>
        <Paper
          sx={(t) => ({
            p: 2,
            borderRadius: t.shape.borderRadius,
            border: "1px solid",
            borderColor: "divider",
            background:
              t.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.20)}, ${alpha(
                    t.palette.secondary.main,
                    0.12
                  )})`
                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.10)}, ${alpha(
                    t.palette.secondary.main,
                    0.06
                  )})`
          })}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.75 }}>
            {subtitle || "Daily"}
          </Typography>
          <Typography variant="h6" fontWeight={950}>
            {title || "Overview"}
          </Typography>
        </Paper>

        <Typography sx={{ mt: 2, mb: 1, fontSize: 12, fontWeight: 900, opacity: 0.65 }}>
          NAVIGATION
        </Typography>

        <List sx={{ mt: 0.5 }}>
          {[
            { to: "/dashboard", primary: "Overview", secondary: "Daily" },
            { to: "/planner", primary: "Planner", secondary: "Month view" },
            { to: "/habits", primary: "Habits", secondary: "Tracker" },
            { to: "/journal", primary: "Journal", secondary: "Notes" },
            { to: "/goals", primary: "Goals", secondary: "Progress" }
          ].map((item, idx) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={() => !isDesktop && setMobileOpen(false)}
              sx={(t) => ({
                mt: idx === 0 ? 0 : 0.75,
                borderRadius: 14,
                border: "1px solid",
                borderColor: "transparent",
                "&.active": {
                  backgroundColor: alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.18 : 0.10),
                  borderColor: alpha(t.palette.primary.main, 0.25)
                }
              })}
            >
              <ListItemText
                primary={item.primary}
                secondary={item.secondary}
                primaryTypographyProps={{ fontWeight: 900 }}
                secondaryTypographyProps={{ sx: { opacity: 0.65 } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
          Signed in as{" "}
          <Box component="span" sx={{ fontWeight: 900 }}>
            {user?.name || user?.email || "—"}
          </Box>
        </Typography>
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <a href="/terms" style={{ color: "#90caf9", fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: "#90caf9", fontSize: 12 }}>Privacy</a>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backdropFilter: "blur(10px)",
          backgroundColor: (t) =>
            t.palette.mode === "dark" ? "rgba(14,14,20,0.70)" : "rgba(255,255,255,0.75)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary"
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!isDesktop && (
              <IconButton onClick={handleDrawerToggle} edge="start" color="inherit">
                <MenuIcon />
              </IconButton>
            )}
            <Typography fontWeight={950}>Life Planner</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            <IconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <Typography
              sx={{
                opacity: 0.8,
                display: { xs: "none", sm: "block" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260
              }}
            >
              {user?.name || user?.email}
            </Typography>

            <Button variant="outlined" color="secondary" onClick={logout} size="small">
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: drawerW }, flexShrink: { md: 0 } }}>
        {!isDesktop && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: drawerW,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "divider"
              }
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {isDesktop && (
          <Drawer
            variant="permanent"
            open
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: drawerW,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "divider"
              }
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerW}px)` },
          p: { xs: 2, sm: 3, lg: 4 }
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1400, mx: "auto", minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}