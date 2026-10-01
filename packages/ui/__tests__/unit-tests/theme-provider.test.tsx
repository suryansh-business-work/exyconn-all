import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../src/tokens/ThemeProvider';
import { createAppTheme } from '../../src/theme';
import { COLOR_MODES, tokensFor } from '../../src/tokens/modes';

describe('ThemeProvider', () => {
  it('mounts its children under the light theme by default', () => {
    render(
      <ThemeProvider>
        <p>hello</p>
      </ThemeProvider>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it.each(COLOR_MODES)('takes a %s theme and resets the page to its canvas', (mode) => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <p>canvas</p>
      </ThemeProvider>,
    );
    expect(screen.getByText('canvas')).toBeInTheDocument();
    // CssBaseline writes the theme's body rules into the document head.
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).join('');
    expect(styles).toContain(tokensFor(mode).background.page);
  });
});
