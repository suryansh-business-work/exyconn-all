import { borderWidth, boxShadow } from '@exyconn/ui';
import type { Theme, SystemStyleObject } from '@exyconn/ui/styles';

/**
 * Flat surface style (Stripe-inspired), adapted to the active color mode. Use inside an
 * sx array, e.g. `sx={[glass, { p: 2 }]}`, so panels stay legible in light & dark.
 *
 * Formerly a frosted-glass (backdrop-blur) surface; now a solid card with a hairline
 * border and a soft, low-spread shadow. Kept named `glass` so its ~30 call sites are
 * unaffected — the visual change lands everywhere at once.
 */
export const glass = (theme: Theme): SystemStyleObject<Theme> => ({
  background: theme.palette.background.paper,
  border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
  // 1 unit of the theme's own radius, so a panel and a card are the same shape.
  borderRadius: 1,
  boxShadow: boxShadow[theme.palette.mode].sm,
});
