import { describe, expect, it } from 'vitest';
import { createTheme } from '@exyconn/ui';
import { a11yGlobalStyles } from '../../../../src/renderer/a11y/global-styles';

const PRIMARY = '#1d4ed8';

describe('a11yGlobalStyles', () => {
  const styles = a11yGlobalStyles(createTheme({ palette: { primary: { main: PRIMARY } } }));

  it('draws a 2px keyboard focus ring in the theme primary colour, offset by 2px', () => {
    expect(styles[':focus-visible:not(input, textarea)']).toEqual({
      outline: `2px solid ${PRIMARY}`,
      outlineOffset: 2,
    });
  });

  it('follows whichever primary colour the theme carries', () => {
    const other = a11yGlobalStyles(createTheme({ palette: { primary: { main: '#0f766e' } } }));
    expect(other[':focus-visible:not(input, textarea)'].outline).toBe('2px solid #0f766e');
  });

  it('cuts animations and transitions to an instant for reduced-motion users', () => {
    expect(styles['@media (prefers-reduced-motion: reduce)']).toEqual({
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
        scrollBehavior: 'auto !important',
      },
    });
  });
});
