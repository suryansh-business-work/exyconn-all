import { borderWidth } from '../../tokens/border.token';
import { enterFrom, keyframeName } from '../../tokens/motion.token';
import { numeric } from '../../tokens/typography.token';
import type { ComponentGroup, ThemeParts } from '../parts';

/**
 * Honours "reduce motion" for everything the theme does not animate through MUI's own
 * transitions (those follow `motion.reducedMotion`): the enter keyframes, and every CSS
 * `transition` a control declares. Near-zero rather than `none`, so `animationend` and
 * `transitionend` still fire for anything waiting on them.
 */
const REDUCED_MOTION = {
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      scrollBehavior: 'auto !important',
    },
  },
};

/** The page-wide rules: resets, the keyframes every surface names, and the focus ring. */
export function baseline({ mode, t }: ThemeParts): ComponentGroup {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        // Native scrollbars, date inputs and autofill follow the palette instead of staying light.
        html: { colorScheme: mode },
        a: { textDecoration: 'none', color: 'inherit' },
        /**
         * A `<button>` does not inherit colour or type from its parent — the UA paints it
         * with `buttontext`, which on a dark surface is near-black. Every `Box
         * component="button"` in the workspace was therefore unreadable in dark mode. MUI's
         * own buttons set both properties in their own class, which outranks this element
         * selector, so they are untouched.
         */
        button: { font: 'inherit', color: 'inherit', letterSpacing: 'inherit' },
        // ag-grid renders outside MUI's components but shows the same money.
        '.ag-cell, .ag-header-cell-text': { fontVariantNumeric: numeric.tabular },
        // The ring for anything that is not an MUI control (theme `focusVisible` draws theirs):
        // links, bare buttons, focusable regions. Keyboard only — a click never shows it.
        ':focus-visible': {
          outline: `${borderWidth.thick}px solid ${t.ring}`,
          outlineOffset: borderWidth.thick,
        },
        [`@keyframes ${keyframeName.fadeIn}`]: {
          from: { opacity: 0, transform: `translateY(${enterFrom.offsetPx}px)` },
        },
        [`@keyframes ${keyframeName.zoomIn}`]: {
          from: { opacity: 0, transform: `scale(${enterFrom.scale})` },
        },
        ...REDUCED_MOTION,
      },
    },
  };
}
