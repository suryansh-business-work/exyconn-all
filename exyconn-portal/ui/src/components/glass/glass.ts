import type { Theme } from '@/components/ui';
import type { SystemStyleObject } from '@mui/system';

/**
 * Flat surface style (Stripe-inspired), adapted to the active color mode. Use inside an
 * sx array, e.g. `sx={[glass, { p: 2 }]}`, so panels stay legible in light & dark.
 *
 * Formerly a frosted-glass (backdrop-blur) surface; now a solid card with a hairline
 * border and a soft, low-spread shadow. Kept named `glass` so its ~30 call sites are
 * unaffected — the visual change lands everywhere at once.
 */
export const glass = (theme: Theme): SystemStyleObject<Theme> => {
  const isLight = theme.palette.mode === 'light';
  return {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1.5,
    boxShadow: isLight
      ? '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)'
      : '0 1px 2px rgba(0,0,0,0.5)',
  };
};
