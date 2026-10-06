import { createTheme, type Shadows } from "@mui/material/styles";
import { palette } from "../../styles/tokens/palette.tokens";
import { scale } from "../../styles/tokens/scale.tokens";
import { roles } from "../../styles/tokens/semantic.tokens";
import { chatComponents } from "./theme.components";
import type { ColorMode } from "./types";

/**
 * The chat's MUI theme, built from the website's own tokens (styles/tokens/*.ts) so the iframe
 * wears exactly the site's colours, type, radii and shadows in both modes.
 *
 * The tokens are CSS (palette ramp variables, colour mixes, OKLCH colours), and the
 * iframe does not load the site's stylesheet, so each role is resolved to its literal value
 * per mode here. MUI's `nativeColor` lets it work with those CSS colours directly (it mixes in
 * CSS instead of parsing hex), and the colour scheme follows `<html data-theme>` like the site.
 */

declare module "@mui/material/styles" {
  interface Palette {
    chat: ChatPalette;
  }
  interface PaletteOptions {
    chat?: ChatPalette;
  }
}

/** The surfaces only the chat paints. */
export interface ChatPalette {
  header: string;
  onHeader: string;
  onHeaderMuted: string;
  bubble: string;
  onBubble: string;
  tint: string;
  online: string;
  offline: string;
  focus: string;
  /** The brand gradient (violet → fuchsia, as in the site's headlines): launcher, own bubbles, send. */
  accent: string;
  onAccent: string;
  /** The night band behind the header, lit like the site's hero. */
  headerBg: string;
  /** Ink on a white control that sits on the header band. */
  onLight: string;
  /** A translucent chip on the header band. */
  headerChip: string;
  /** Edge of a bubble or card that sits on the thread's background. */
  edge: string;
  /** The segmented tab control: its track and the selected thumb. */
  track: string;
  thumb: string;
  /** Agent initials avatar. */
  agent: string;
  onAgent: string;
}

const TOKEN = /var\(--([a-z\d-]+)\)/g;

/** A palette ramp variable's hue and step, e.g. the gray ramp's step 900 → `gray`, `900`. */
function paletteValue(name: string): string {
  const rest = name.slice("palette-".length);
  const cut = rest.lastIndexOf("-");
  const family = palette[rest.slice(0, cut) as keyof typeof palette] as Record<string, string>;
  return family[rest.slice(cut + 1)];
}

/** A token's literal CSS value in one mode, with every `var(--…)` inside it resolved. */
function resolve(value: string, mode: ColorMode): string {
  return value.replaceAll(TOKEN, (_match, name: string) => {
    if (name.startsWith("palette-")) {
      return paletteValue(name);
    }
    return role(name.slice("color-".length), mode);
  });
}

/** A semantic role (`fg`, `surface`, `primary`…) in one mode. */
export function role(name: string, mode: ColorMode): string {
  const [light, dark] = roles[name];
  return resolve(mode === "light" ? light : dark, mode);
}

/** Text on a fill that changes lightness at night: white by day, dark ink by night. */
const onFill = (mode: ColorMode): string => role(mode === "light" ? "on-solid" : "on-bright", mode);

/** The site's own gradient pair; both stops carry white text at 4.5:1 or better. */
function accent(c: (name: string) => string): string {
  return `linear-gradient(135deg, ${c("violet-strong")} 0%, ${c("fuchsia-deep")} 100%)`;
}

/** The inner pages' night band (inverse → indigo night) with a violet glow in the corner. */
function headerBg(c: (name: string) => string): string {
  const glow = `color-mix(in oklab, ${c("violet")} 38%, transparent)`;
  const haze = `color-mix(in oklab, ${c("fuchsia")} 18%, transparent)`;
  return [
    `radial-gradient(90% 120% at 100% 0%, ${glow}, transparent 60%)`,
    `radial-gradient(60% 90% at 0% 100%, ${haze}, transparent 70%)`,
    `linear-gradient(160deg, ${c("inverse")}, ${c("indigo-night")})`,
  ].join(", ");
}

function paletteFor(mode: ColorMode) {
  const c = (name: string) => role(name, mode);
  return {
    mode,
    primary: { main: c("primary"), dark: c("primary-hover"), contrastText: c("on-primary") },
    secondary: { main: c("purple-strong"), contrastText: c("on-solid") },
    error: { main: c("red-fg"), contrastText: onFill(mode) },
    warning: { main: c("amber-fg"), contrastText: onFill(mode) },
    success: { main: c("green-fg"), contrastText: onFill(mode) },
    info: { main: c("primary"), contrastText: c("on-primary") },
    background: { default: c("surface-subtle"), paper: c("surface") },
    text: { primary: c("fg"), secondary: c("fg-muted"), disabled: c("fg-disabled") },
    divider: c("line"),
    chat: {
      header: c("inverse"),
      onHeader: c("on-solid"),
      onHeaderMuted: c("on-solid-muted"),
      bubble: c("surface"),
      onBubble: c("fg"),
      tint: c("primary-subtle"),
      online: c("green-bright"),
      offline: c("fg-subtle"),
      focus: c("focus-ring"),
      accent: accent(c),
      onAccent: c("on-solid"),
      headerBg: headerBg(c),
      onLight: c("on-bright"),
      headerChip: `color-mix(in srgb, ${c("on-solid")} 12%, transparent)`,
      edge: c(mode === "light" ? "line" : "line-subtle"),
      track: c(mode === "light" ? "surface-muted" : "surface-subtle"),
      thumb: c(mode === "light" ? "surface" : "surface-muted"),
      agent: c("violet-muted"),
      onAgent: c("violet-fg"),
    },
  };
}

/** The site's five shadow steps spread over MUI's 25 elevations. */
function shadows(): Shadows {
  const s = scale.shadow;
  const steps = [s.none, s.xs, s.sm, s.md, s.md, s.lg, s.lg, s.lg, s.lg];
  return Array.from({ length: 25 }, (_, index) =>
    resolve(steps[index] ?? s.xl, "light")
  ) as Shadows;
}

const px = (value: string): number => Number.parseFloat(value);

export function createChatTheme(reducedMotion: boolean) {
  return createTheme({
    cssVariables: {
      nativeColor: true,
      colorSchemeSelector: "data-theme",
      // A `color-scheme` that differs from the host page makes browsers paint the iframe opaque.
      disableCssColorScheme: true,
    },
    colorSchemes: {
      light: { palette: paletteFor("light") },
      dark: { palette: paletteFor("dark") },
    },
    shape: { borderRadius: px(scale.radius.md) },
    shadows: shadows(),
    typography: {
      fontFamily: `${scale["font-family"].sans}, system-ui, -apple-system, "Segoe UI", Roboto, Arial`,
      button: { textTransform: "none", fontWeight: Number(scale["font-weight"].semibold) },
    },
    transitions: reducedMotion
      ? {
          duration: {
            shortest: 0,
            shorter: 0,
            short: 0,
            standard: 0,
            complex: 0,
            enteringScreen: 0,
            leavingScreen: 0,
          },
        }
      : undefined,
    components: chatComponents(reducedMotion),
  });
}

export const chatRadius = {
  panel: scale.radius["2xl"],
  bubble: scale.radius.xl,
  tail: scale.radius.sm,
  pill: scale.radius.pill,
} as const;
