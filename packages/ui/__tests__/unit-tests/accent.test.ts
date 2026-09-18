import { describe, expect, it } from 'vitest';
import { readableAccent } from '../../src/a11y/accent';
import { AA_LARGE, AA_TEXT, contrastRatio } from '../../src/a11y/contrast';
import { createAppTheme } from '../../src/theme';
import { amber, emerald, green, indigo } from '../../src/tokens/colors.tokens';

const ACCENTS = [amber[500], green[500], emerald[400], indigo[800]];

describe.each(['light', 'dark'] as const)('a categorical accent in %s mode', (mode) => {
  const theme = createAppTheme(mode);
  const { paper, muted } = theme.palette.background;

  it.each(ACCENTS)('reads as text on the panel (%s)', (accent) => {
    expect(contrastRatio(readableAccent(accent, theme), paper)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(ACCENTS)('reads as an icon on the muted surface (%s)', (accent) => {
    const ink = readableAccent(accent, theme, 'graphic', muted);
    expect(contrastRatio(ink, muted)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

it('leaves an accent that already passes exactly as it was', () => {
  expect(readableAccent(indigo[800], createAppTheme('light'))).toBe(indigo[800]);
});
