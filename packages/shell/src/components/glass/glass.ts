import { CARD_RADIUS, borderWidth, boxShadow } from '@exyconn/ui';
import type { Theme, SystemStyleObject } from '@exyconn/ui/styles';

/**
 * The surface itself — border, corner and shadow, in either colour mode — with no padding
 * of its own.
 *
 * Reach for `panel`, `densePanel` or `readingPanel` below instead: they are this surface
 * with the padding already decided. This one is for a surface that sets its own, like a
 * strip whose content is flush to the edge.
 */
export const glass = (theme: Theme): SystemStyleObject<Theme> => ({
  background: theme.palette.background.paper,
  border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
  // The card corner, as a px string: a panel and a card are the same shape.
  borderRadius: `${CARD_RADIUS}px`,
  boxShadow: boxShadow[theme.palette.mode].sm,
});

/**
 * The surface with its own padding — what a panel should be reached for by name.
 *
 * There are two honest kinds of panel in this portal and there were eight paddings: the
 * call sites each decided, so the same card was 16px here and 24px there and nobody could
 * say which was right. Naming them settles it, and a screen that needs something else says
 * so deliberately (`sx={[panel, { p: 4 }]}`).
 */
export const panel = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glass(theme),
  p: { xs: 1.5, md: 2 },
});

/** Grids, tiles and anything that holds its own dense chrome. */
export const densePanel = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glass(theme),
  p: { xs: 1, md: 1.5 },
});

/** A form or a page of prose, where the content wants air around it. */
export const readingPanel = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glass(theme),
  p: { xs: 2, md: 3 },
});
