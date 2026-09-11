import { ramp } from "./palette.tokens";

/** `color-mix()` of black, for a shadow that darkens whatever it falls on. */
const shade = (percent: number): string =>
  `color-mix(in srgb, ${ramp("base", "black")} ${percent}%, transparent)`;

/**
 * Every non-colour token, emitted as `--{group}-{name}` (so `space.4` is `--space-4`).
 *
 * The type scale had grown twenty-nine sizes between 0.4rem and 10rem; these sixteen
 * steps cover every one of them. `4xs`/`3xs` are the pricing-card status dot and its
 * label, `8xl`/`9xl` the decorative glyphs behind the hero — neither pair is body copy.
 *
 * `radius.pill` is for anything whose corner should be "as round as it gets": 50px, 999px
 * and 9999px all meant that, and 50px quietly stopped being a pill on tall buttons.
 */
export const scale = {
  "font-size": {
    "4xs": "0.4rem",
    "3xs": "0.65rem",
    "2xs": "0.7rem",
    xs: "0.8rem",
    sm: "0.9rem",
    md: "1rem",
    lg: "1.1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.8rem",
    "4xl": "2rem",
    "5xl": "2.5rem",
    "6xl": "3rem",
    "7xl": "5rem",
    "8xl": "7rem",
    "9xl": "10rem",
  },
  /* Unitless, so a nested element inherits a ratio rather than a fixed height. */
  "line-height": {
    tight: "1.2",
    snug: "1.35",
    normal: "1.6",
    relaxed: "1.75",
  },
  "font-weight": {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
  /* The site ships one face; the stack is the fallback chain, not a second choice. */
  "font-family": {
    sans: '"Inter Tight", sans-serif',
  },
  /* The 0.25rem rhythm every gap, pad and inset is a multiple of. */
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    24: "6rem",
  },
  "border-width": {
    hairline: "1px",
    thick: "1.5px",
    heavy: "2px",
  },
  radius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
    pill: "9999px",
    circle: "50%",
  },
  shadow: {
    none: "none",
    xs: `0 1px 3px ${shade(6)}`,
    sm: `0 2px 8px ${shade(6)}`,
    md: `0 4px 16px ${shade(8)}`,
    lg: `0 8px 32px ${shade(10)}`,
    xl: `0 12px 48px ${shade(12)}`,
    /* An inset well — a pressed control, a code block. */
    inset: `inset 0 1px 2px ${shade(10)}`,
  },
  duration: {
    fast: "0.15s",
    base: "0.2s",
    slow: "0.3s",
  },
  ease: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    out: "ease-out",
  },
  /* The two transitions almost every interactive element wants. */
  transition: {
    color: "color var(--duration-base) var(--ease-standard)",
    surface: [
      "background-color var(--duration-base) var(--ease-standard)",
      "border-color var(--duration-base) var(--ease-standard)",
      "box-shadow var(--duration-base) var(--ease-standard)",
    ].join(", "),
  },
  "focus-ring": {
    offset: "2px",
    width: "3px",
  },
  /* `skip-link` tops the stack: a keyboard user must see it even while a modal is open. */
  z: {
    base: "0",
    raised: "1",
    sticky: "10",
    header: "50",
    overlay: "100",
    modal: "1000",
    "skip-link": "9999",
  },
} as const;
