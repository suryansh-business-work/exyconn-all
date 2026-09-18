import { createTheme, type Shadows, type Theme } from '../styles';
import { BASE_RADIUS } from '../tokens/border.token';
import type { ShadowScale } from '../tokens/box-shadow.token';
import { duration, easing } from '../tokens/motion.token';
import { fontFamily, fontWeight, letterSpacing } from '../tokens/typography.token';
import { tokensFor, type ColorMode } from '../tokens/modes';
import { baseline } from './components/baseline';
import { feedback } from './components/feedback';
import { inputs } from './components/inputs';
import { navigation } from './components/navigation';
import { surfaces } from './components/surfaces';
import type { ThemeParts } from './parts';

export type { ColorMode };

/** Which way the script the portal is being read in runs. */
export type ThemeDirection = 'ltr' | 'rtl';

declare module '@mui/material/styles' {
  /**
   * shadcn/ui's two extra grounds, on the palette so `sx={{ bgcolor: 'background.muted' }}`
   * works anywhere: the quiet fill of a hovered or current row, and the navigation drawer.
   */
  interface TypeBackground {
    muted: string;
    sidebar: string;
  }
}

/**
 * MUI's 25 elevation steps, folded onto the five shadcn shadows: 1 is `xs`, 2–3 `sm` (a card),
 * 4–7 `md`, 8–15 `lg` (MUI's menus sit at 8), 16–24 `xl` (drawers and dialogs).
 */
function elevationSteps(scale: ShadowScale): Shadows {
  const steps: Array<[number, string]> = [
    [1, scale.xs],
    [2, scale.sm],
    [4, scale.md],
    [8, scale.lg],
    [9, scale.xl],
  ];
  return [
    'none',
    ...steps.flatMap(([count, shadow]) => Array.from({ length: count }, () => shadow)),
  ] as Shadows;
}

/**
 * Builds the Exyconn portal theme — shadcn/ui's zinc theme, drawn with MUI — for a mode.
 *
 * Every value comes from `src/tokens` — this file decides which token plays which MUI role,
 * and the files in `./components` decide how each MUI family wears them. A colour that is not
 * in the tokens cannot be in the theme.
 *
 * `direction` is on the theme rather than only on the document because MUI's own components
 * read it to place their icons, drawers and menus — a right-to-left page whose theme still
 * says left-to-right puts every dropdown arrow on the wrong side.
 */
export function createAppTheme(mode: ColorMode, direction: ThemeDirection = 'ltr'): Theme {
  const t = tokensFor(mode);
  const parts: ThemeParts = { mode, t };
  return createTheme({
    direction,
    palette: {
      mode,
      // MUI picks the text colour on a filled button, chip or alert from its background, and by
      // default settles for 3:1 — below WCAG AA's 4.5:1 for normal text (SC 1.4.3).
      contrastThreshold: 4.5,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary },
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      info: { main: t.info },
      background: {
        default: t.background.page,
        paper: t.background.panel,
        muted: t.background.muted,
        sidebar: t.background.sidebar,
      },
      text: { primary: t.text.primary, secondary: t.text.secondary },
      divider: t.divider,
      // shadcn's `accent`: every hovered row, option and cell fills with the muted surface.
      action: { hover: t.background.muted },
    },
    shape: { borderRadius: BASE_RADIUS },
    shadows: elevationSteps(t.shadow),
    // The keyboard ring on every MUI control, switch and checkbox tracks included: shadcn's
    // `ring-2 ring-offset-2` in the ring colour, which clears 3:1 on every ground (SC 2.4.7).
    focusVisible: { outlineColor: t.ring },
    // MUI's own transitions stand still when the system asks for less motion.
    motion: { reducedMotion: 'system' },
    transitions: {
      duration: { shortest: duration.fast, shorter: duration.base, short: duration.base },
      easing: { easeInOut: easing.standard },
    },
    typography: {
      fontFamily: fontFamily.sans,
      fontWeightRegular: fontWeight.regular,
      fontWeightMedium: fontWeight.medium,
      fontWeightBold: fontWeight.bold,
      /**
       * The page title: shadcn's `font-semibold tracking-tight`, sized against the screen
       * rather than fixed, so "Purchase orders" is one line on a phone instead of three.
       * `clamp` keeps it between 1.5rem and the 2rem a desk gets.
       */
      h4: {
        fontSize: 'clamp(1.5rem, 1.1rem + 2vw, 2rem)',
        fontWeight: fontWeight.semibold,
        letterSpacing: letterSpacing.tighter,
      },
      h5: {
        fontSize: 'clamp(1.25rem, 1rem + 1.2vw, 1.5rem)',
        fontWeight: fontWeight.semibold,
        letterSpacing: letterSpacing.tight,
      },
      h6: { fontWeight: fontWeight.semibold, letterSpacing: letterSpacing.snug },
      subtitle2: { fontWeight: fontWeight.semibold },
      button: { textTransform: 'none', fontWeight: fontWeight.medium },
      overline: { fontWeight: fontWeight.semibold, letterSpacing: letterSpacing.wide },
    },
    components: {
      ...baseline(parts),
      ...inputs(parts),
      ...navigation(parts),
      ...surfaces(parts),
      ...feedback(parts),
    },
  });
}

/** Default theme instance used by standalone component tests. */
export const theme = createAppTheme('light');
