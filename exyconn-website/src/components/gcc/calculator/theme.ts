import { createTheme } from "@mui/material/styles";
import { roleVar } from "../../../styles/tokens/semantic.tokens";
import { scale } from "../../../styles/tokens/scale.tokens";

/**
 * The calculator's MUI theme. The island renders inside the site's own page, where every colour
 * role is already a CSS variable that flips with `<html data-theme>` — so the palette points at
 * those variables (`nativeColor` lets MUI mix them in CSS) and one theme serves both modes.
 *
 * `primary` stays the site's accessible blue for actions and text; the GCC accent blue
 * (`sky`, palette brand 400) is used for progress, rules and highlights only.
 */
const c = roleVar;
const px = (value: string): number => Number.parseFloat(value);

export const gccTokens = {
  accent: c("sky"),
  accentSoft: c("sky-subtle"),
  accentInk: c("sky-fg"),
  highlight: c("lime-fg"),
  night: c("inverse"),
  onNight: c("on-solid"),
  onNightMuted: c("on-solid-muted"),
  nightMetric: c("lime-bright"),
  nightAccent: c("sky-bright"),
  surface: c("surface"),
  surfaceSubtle: c("surface-subtle"),
  line: c("line"),
  radius: scale.radius.lg,
} as const;

export function createCalculatorTheme() {
  return createTheme({
    cssVariables: { nativeColor: true, disableCssColorScheme: true, cssVarPrefix: "gcc" },
    palette: {
      primary: { main: c("primary"), dark: c("primary-hover"), contrastText: c("on-primary") },
      secondary: { main: c("sky-fg"), contrastText: c("on-solid") },
      error: { main: c("red-fg"), contrastText: c("on-solid") },
      warning: { main: c("amber-fg"), contrastText: c("on-solid") },
      success: { main: c("green-fg"), contrastText: c("on-solid") },
      info: { main: c("sky-fg"), contrastText: c("on-solid") },
      background: { default: c("page"), paper: c("surface") },
      text: { primary: c("fg"), secondary: c("fg-muted"), disabled: c("fg-subtle") },
      divider: c("line"),
    },
    shape: { borderRadius: px(scale.radius.md) },
    typography: {
      fontFamily: "inherit",
      button: { textTransform: "none", fontWeight: Number(scale["font-weight"].semibold) },
    },
    components: {
      MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
      MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { defaultProps: { variant: "outlined" } },
      MuiTooltip: { defaultProps: { enterTouchDelay: 0, leaveTouchDelay: 4000 } },
    },
  });
}
