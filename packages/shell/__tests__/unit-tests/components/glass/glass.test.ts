import { describe, expect, it } from 'vitest';
import {
  CARD_RADIUS,
  borderWidth,
  createAppTheme,
  duration,
  easing,
  portalShadow,
  transition,
} from '@exyconn/ui';
import { densePanel, glass, interactive, panel, readingPanel } from '@/components/glass/glass';

describe.each(['light', 'dark'] as const)('glass surfaces in %s mode', (mode) => {
  const theme = createAppTheme(mode);

  it('draws the card surface from the theme, with no padding of its own', () => {
    expect(glass(theme)).toEqual({
      background: theme.palette.background.paper,
      border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
      borderRadius: `${CARD_RADIUS}px`,
      boxShadow: portalShadow[mode].sm,
    });
  });

  it('names the three paddings a panel can have', () => {
    const surface = glass(theme);
    expect(panel(theme)).toEqual({ ...surface, p: { xs: 2, md: 3 } });
    expect(densePanel(theme)).toEqual({ ...surface, p: { xs: 1, md: 1.5 } });
    expect(readingPanel(theme)).toEqual({ ...surface, p: { xs: 2, md: 4 } });
  });

  it('lifts an openable surface on hover and settles it on press', () => {
    expect(interactive(theme)).toEqual({
      transition: `${transition.surface}, box-shadow ${duration.fast}ms ${easing.standard}`,
      '&:hover': {
        borderColor: theme.palette.text.secondary,
        boxShadow: portalShadow[mode].md,
      },
      '&:active': { boxShadow: portalShadow[mode].sm },
    });
  });
});
