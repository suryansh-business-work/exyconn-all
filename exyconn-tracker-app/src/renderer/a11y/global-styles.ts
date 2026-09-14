import type { Theme } from '@exyconn/ui';

/** Width of the keyboard focus ring, and its gap from the element, in CSS px. */
const FOCUS_RING = 2;

/**
 * Page-wide accessibility styles, applied once by the app frame of both windows.
 *
 * - A visible keyboard focus ring (WCAG 2.4.7). The tracker theme is a plain MUI theme, and
 *   `ButtonBase` has no focus style of its own unless a ripple is asked for, so a tabbed-to
 *   tile, thumbnail or avatar showed nothing. `:focus-visible` only matches keyboard focus —
 *   except in a text field, which matches on a click too and already draws its own focused
 *   border, so text fields are left out.
 * - Reduced motion (WCAG 2.3.3): anyone who has asked the OS for less motion gets no pulsing
 *   dots, and fills and hover lifts jump instead of gliding — every state is still shown, just
 *   without the movement.
 */
export function a11yGlobalStyles(theme: Theme) {
  return {
    ':focus-visible:not(input, textarea)': {
      outline: `${FOCUS_RING}px solid ${theme.palette.primary.main}`,
      outlineOffset: FOCUS_RING,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
        scrollBehavior: 'auto !important',
      },
    },
  };
}
