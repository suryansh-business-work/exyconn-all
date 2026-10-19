import {
  CARD_RADIUS,
  FRAME_RADIUS,
  SOLID_SURFACES,
  borderWidth,
  duration,
  easing,
  glassCard,
  portalShadow,
  tokensFor,
  transition,
} from '@exyconn/ui';
import type { Theme, SystemStyleObject } from '@exyconn/ui/styles';

/**
 * The surface itself — frosted glass on the canvas, its corner and its soft shadow, in either
 * colour mode — with no padding of its own. Turns solid where a person has asked for less
 * transparency or more contrast.
 *
 * Reach for `panel`, `densePanel` or `readingPanel` below instead: they are this surface
 * with the padding already decided. This one is for a surface that sets its own, like a
 * strip whose content is flush to the edge.
 */
export const glass = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glassCard(tokensFor(theme.palette.mode)),
  // The card corner, as a px string: a panel and a card are the same shape.
  borderRadius: `${CARD_RADIUS}px`,
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
  p: { xs: 2, md: 3 },
});

/** Grids, tiles and anything that holds its own dense chrome. */
export const densePanel = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glass(theme),
  p: { xs: 1, md: 1.5 },
});

/** A form or a page of prose, where the content wants air around it. */
export const readingPanel = (theme: Theme): SystemStyleObject<Theme> => ({
  ...glass(theme),
  p: { xs: 2, md: 4 },
});

/**
 * The large frosted frame the page content sits in on a desk-sized screen — the reference's
 * rounded app surface. A lighter frost than a card, so the cards on it still lift. On a phone
 * the content runs edge to edge instead: a frame there only costs width.
 */
export const pageFrame = (theme: Theme): SystemStyleObject<Theme> => {
  const t = tokensFor(theme.palette.mode);
  return {
    [theme.breakpoints.up('md')]: {
      backgroundColor: t.glass.frame,
      border: `${borderWidth.hairline}px solid ${t.glass.edge}`,
      borderRadius: `${FRAME_RADIUS}px`,
      [SOLID_SURFACES]: { backgroundColor: t.background.page, borderColor: t.divider },
    },
  };
};

/**
 * The feedback a surface gives when it can be opened: it lifts on hover, settles on press.
 *
 * Added to a panel that is, or holds, a button — a record card, a deal, a tile. A surface
 * that answers a pointer is how somebody tells "this opens" from "this is a label" before
 * they commit a click, which no cursor change says on a phone. Reduced motion shortens the
 * transition to nothing (see the theme baseline).
 */
export const interactive = (theme: Theme): SystemStyleObject<Theme> => ({
  transition: `${transition.surface}, box-shadow ${duration.fast}ms ${easing.standard}`,
  '&:hover': {
    borderColor: theme.palette.text.secondary,
    boxShadow: portalShadow[theme.palette.mode].md,
  },
  '&:active': { boxShadow: portalShadow[theme.palette.mode].sm },
});
