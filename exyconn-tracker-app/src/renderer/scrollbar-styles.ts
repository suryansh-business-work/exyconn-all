import { alpha, type Theme } from '@exyconn/ui';

/** How strongly the scrollbar thumb shows against the panel: present, never louder than text. */
const THUMB_OPACITY = 0.3;

/**
 * Scrollbars that belong to the window instead of to the operating system.
 *
 * Left alone, Windows paints its light-grey bar and white track down the side of a dark
 * window. `colorScheme` makes every native control (scrollbars included) follow the theme;
 * the thin thumb in the text colour over a clear track then matches the cards it scrolls.
 * `scrollbar-color` inherits, `scrollbar-width` does not — hence the universal selector.
 */
export function scrollbarGlobalStyles(theme: Theme) {
  return {
    html: {
      colorScheme: theme.palette.mode,
      scrollbarColor: `${alpha(theme.palette.text.primary, THUMB_OPACITY)} transparent`,
    },
    '*': { scrollbarWidth: 'thin' },
  };
}
