// The design system's colour ramps, by path: its package entry and its mode tokens import MUI,
// which has no place in a React Native bundle. This file is the one hex source both apps share.
import {
  amber,
  black,
  emerald,
  indigo,
  neutral,
  orange,
  red,
  slate,
  teal,
  white,
} from '@exyconn/ui/src/tokens/colors.tokens';

/** The phone's own light/dark chrome — the desktop tracker's, so the two apps look like one. */
export interface Chrome {
  /** The page behind everything. */
  app: string;
  /** A panel on it. */
  paper: string;
  ink: string;
  muted: string;
  /** Hairline borders and dividers. */
  hairline: string;
  success: string;
  warning: string;
  error: string;
}

/** Hairlines are the ink at 10%, so they weigh the same on either ground. */
const HAIRLINE_ALPHA = '1a';

/**
 * Status hues run DARK on the light chrome and LIGHT on the dark one, exactly as the design
 * system's `modes/*.token.ts` pick them — the same green is a 2:1 smear on the wrong ground.
 */
export const CHROME: Readonly<Record<'light' | 'dark', Chrome>> = {
  light: {
    app: neutral[50],
    paper: white,
    ink: slate[900],
    muted: neutral[500],
    hairline: `${slate[950]}${HAIRLINE_ALPHA}`,
    success: emerald[900],
    warning: orange[800],
    error: red[900],
  },
  dark: {
    app: neutral[900],
    paper: neutral[800],
    ink: neutral[100],
    muted: neutral[300],
    hairline: `${white}${HAIRLINE_ALPHA}`,
    success: emerald[300],
    warning: amber[300],
    error: red[300],
  },
};

/** Exyconn's own brand, used until the portal's branding arrives (or if it fails to load). */
export const FALLBACK_BRAND = {
  primary: indigo[500],
  secondary: teal[400],
  background: slate[950],
  text: neutral[50],
} as const;

/** Ink that reads on a brand-coloured button, whichever brand the workspace picked. */
export const ON_DARK = white;
export const ON_LIGHT = slate[900];

/** Behind a dialog or sheet: the design system's black at half strength. */
export const SCRIM = `${black}80`;
