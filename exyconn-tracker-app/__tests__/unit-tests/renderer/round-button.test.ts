import { describe, expect, it } from 'vitest';
import { roundButton } from '../../../src/renderer/round-button';
import { DRAG, NO_DRAG } from '../../../src/renderer/window-drag';
import { buildTheme } from '../../../src/renderer/theme';

describe('window drag regions', () => {
  it('names the strip that drags and the controls that opt back out', () => {
    expect(DRAG).toEqual({ WebkitAppRegion: 'drag' });
    expect(NO_DRAG).toEqual({ WebkitAppRegion: 'no-drag' });
  });
});

describe('roundButton', () => {
  it('is a 44px round paper button that can be clicked inside the drag bar', () => {
    const theme = buildTheme(null, 'light');

    expect(roundButton(theme)).toMatchObject({
      WebkitAppRegion: 'no-drag',
      width: 44,
      height: 44,
      borderRadius: '50%',
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    });
  });

  it('follows the theme it is drawn in', () => {
    const light = roundButton(buildTheme(null, 'light'));
    const dark = roundButton(buildTheme(null, 'dark'));

    expect(dark.backgroundColor).not.toBe(light.backgroundColor);
    expect(dark.WebkitAppRegion).toBe('no-drag');
  });
});
