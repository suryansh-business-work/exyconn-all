import { describe, expect, it } from 'vitest';
import { ROUND_BUTTON_SIZE, roundButton } from '../../src/surfaces';
import { createAppTheme } from '../../src/theme';
import { boxShadow } from '../../src/tokens/box-shadow.token';
import { COLOR_MODES } from '../../src/tokens/modes';

describe('roundButton', () => {
  it.each(COLOR_MODES)('is a round paper button with a hairline in %s mode', (mode) => {
    const theme = createAppTheme(mode);
    expect(roundButton(theme)).toEqual({
      width: ROUND_BUTTON_SIZE,
      height: ROUND_BUTTON_SIZE,
      borderRadius: '50%',
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: boxShadow[mode].sm,
    });
  });

  it('takes a larger size for the trackers', () => {
    const style = roundButton(createAppTheme('light'), 48);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
  });
});
