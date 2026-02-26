import { createTheme, alpha } from "@mui/material/styles";

const moon = {
  blush: "#F5D5E0",
  periwinkle: "#6667AB",
  orchid: "#7B337E",
  plum: "#420D4B",
  void: "#210635"
};

export function buildTheme(mode = "dark") {
  const isDark = mode === "dark";

  // Dark: mostly black
  const darkBg = {
    default: "#07070A",
    paper: "#0E0E14"
  };

  // Light: "moonlight" whites with violet tint
  const lightBg = {
    default: "#F6F3FA",
    paper: "#FFFFFF"
  };

  const theme = createTheme({
    palette: {
      mode,

      primary: { main: moon.periwinkle },
      secondary: { main: moon.orchid },

      background: isDark ? darkBg : lightBg,

      text: isDark
        ? { primary: "#F3F2F7", secondary: "rgba(243,242,247,0.72)" }
        : { primary: "#14131A", secondary: "rgba(20,19,26,0.70)" },

      divider: isDark ? "rgba(255,255,255,0.08)" : "rgba(20,19,26,0.10)",

      // optional but helpful for chips/badges later
      info: { main: moon.periwinkle },
      success: { main: "#3DDC97" },
      warning: { main: "#F4B266" },
      error: { main: "#F06A6A" }
    },

    // 🔒 Design system: ONE radius token for the whole app
    shape: { borderRadius: 16 },

    typography: {
      fontFamily: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial"].join(","),
      h5: { fontWeight: 950, letterSpacing: "-0.02em" },
      h6: { fontWeight: 900, letterSpacing: "-0.01em" },
      subtitle1: { fontWeight: 800 },
      button: { fontWeight: 850, letterSpacing: "-0.01em" }
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            ...(isDark
              ? {
                  backgroundImage: `
                    radial-gradient(circle at 20% 10%, rgba(102,103,171,0.18), transparent 40%),
                    radial-gradient(circle at 80% 20%, rgba(123,51,126,0.14), transparent 45%),
                    radial-gradient(circle at 50% 90%, rgba(66,13,75,0.10), transparent 55%),
                    linear-gradient(#07070A, #07070A)
                  `,
                  backgroundAttachment: "fixed"
                }
              : {
                  backgroundImage: `
                    radial-gradient(circle at 18% 12%, rgba(102,103,171,0.18), transparent 42%),
                    radial-gradient(circle at 82% 18%, rgba(123,51,126,0.14), transparent 46%),
                    radial-gradient(circle at 50% 92%, rgba(245,213,224,0.18), transparent 55%),
                    linear-gradient(#F6F3FA, #F6F3FA)
                  `,
                  backgroundAttachment: "fixed"
                })
          }
        }
      },

      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderRadius: theme.shape.borderRadius
          })
        }
      },

      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: "none" }
        }
      },

      // Inputs: consistent rounded, clean borders
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 14,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.03)
                : alpha("#000000", 0.02),
            transition: "box-shadow 180ms ease, transform 180ms ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(theme.palette.primary.main, 0.55)
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.20)}`
            }
          }),
          notchedOutline: ({ theme }) => ({
            borderColor: theme.palette.divider
          })
        }
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: "none",
            borderRadius: 14,
            paddingInline: 14,
            paddingBlock: 9,
            transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
            "&:hover": {
              transform: "translateY(-1px)"
            },
            "&.MuiButton-containedPrimary:hover": {
              boxShadow: `0 10px 22px ${alpha(theme.palette.primary.main, 0.22)}`
            }
          })
        }
      },

      MuiChip: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 999,
            fontWeight: 800,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.04)
                : alpha("#000000", 0.04)
          })
        }
      },

      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 850,
            borderColor: theme.palette.divider
          })
        }
      },

      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 14,
            transition: "background-color 140ms ease, transform 140ms ease",
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.04)
            }
          })
        }
      }
    }
  });

  return theme;
}