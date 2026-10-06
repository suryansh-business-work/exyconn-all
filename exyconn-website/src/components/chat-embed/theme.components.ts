import type { Components, Theme } from "@mui/material/styles";
import { scale } from "../../styles/tokens/scale.tokens";

/**
 * The chat's component overrides: the site's control language (12px corners on buttons and
 * fields, pill chips, hairline card edges, high-contrast ink buttons like the header's
 * "Get started") applied to MUI, so every screen of the chat inherits it.
 */

const v = (name: string): string => `var(--mui-palette-${name})`;
const ease = `${scale.duration.fast} ${scale.ease.standard}`;
const weight = (name: keyof (typeof scale)["font-weight"]): number =>
  Number(scale["font-weight"][name]);

export function chatComponents(reducedMotion: boolean): Components<Theme> {
  const focus = `${scale["focus-ring"].width} solid ${v("chat-focus")}`;
  return {
    MuiButtonBase: {
      defaultProps: { disableRipple: reducedMotion },
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": { outline: focus, outlineOffset: scale["focus-ring"].offset },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: scale.radius.lg, letterSpacing: "-0.005em" },
        sizeLarge: { minHeight: 46, fontSize: scale["font-size"].md },
      },
      variants: [
        {
          // Ink on paper, like the site's primary call to action — dark by day, light at night.
          props: { variant: "contained", color: "primary" },
          style: {
            backgroundColor: v("text-primary"),
            color: v("background-paper"),
            "&:hover": { backgroundColor: v("text-secondary") },
          },
        },
        {
          props: { variant: "outlined", color: "primary" },
          style: {
            borderColor: v("chat-edge"),
            color: v("text-primary"),
            backgroundColor: v("background-paper"),
            "&:hover": { borderColor: v("text-secondary"), backgroundColor: v("chat-track") },
          },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: { root: { transition: `background-color ${ease}, color ${ease}` } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: scale.radius.lg,
          backgroundColor: v("background-paper"),
          transition: `box-shadow ${ease}`,
          "&.Mui-focused": { boxShadow: `0 0 0 4px ${v("chat-tint")}` },
        },
      },
    },
    // Placeholder text is still text: full-strength muted ink (4.5:1), not MUI's 42% opacity.
    MuiInputBase: {
      styleOverrides: {
        input: { "&::placeholder": { color: v("text-secondary"), opacity: 1 } },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, marginRight: 2 } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: scale.radius.pill, fontWeight: weight("medium") },
        outlined: { borderColor: v("chat-edge"), backgroundColor: v("background-paper") },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: scale.radius.lg } } },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${v("divider")}`,
          boxShadow: "var(--mui-shadows-8)",
          minWidth: 220,
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: scale.radius.xl, backgroundImage: "none" } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: scale.radius.lg } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  };
}
