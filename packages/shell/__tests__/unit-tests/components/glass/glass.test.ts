import { describe, expect, it } from 'vitest';
import {
  CARD_RADIUS,
  FRAME_RADIUS,
  SOLID_SURFACES,
  createAppTheme,
  duration,
  easing,
  glassCard,
  portalShadow,
  tokensFor,
  transition,
} from '@exyconn/ui';
import {
  densePanel,
  glass,
  interactive,
  pageFrame,
  panel,
  readingPanel,
} from '@/components/glass/glass';

describe.each(['light', 'dark'] as const)('glass surfaces in %s mode', (mode) => {
  const theme = createAppTheme(mode);

  it('draws the card surface as the theme s frosted glass, with no padding of its own', () => {
    expect(glass(theme)).toEqual({
      ...glassCard(tokensFor(mode)),
      borderRadius: `${CARD_RADIUS}px`,
    });
    expect(glass(theme)).toMatchObject({ backgroundColor: tokensFor(mode).glass.card });
  });

  it('frames the page in a lighter frost on a desk, solid when transparency is unwelcome', () => {
    const desk = pageFrame(theme)[theme.breakpoints.up('md')] as Record<string, unknown>;
    expect(desk).toMatchObject({
      backgroundColor: tokensFor(mode).glass.frame,
      borderRadius: `${FRAME_RADIUS}px`,
    });
    expect(desk[SOLID_SURFACES]).toMatchObject({
      backgroundColor: theme.palette.background.default,
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
