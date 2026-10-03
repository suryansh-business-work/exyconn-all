import { ThemeProvider } from './ThemeProvider';
import { createAppTheme } from '../theme';
import { tokensFor } from './modes';

describe('ThemeProvider (tokens)', () => {
  it('renders its children', () => {
    cy.mount(
      <ThemeProvider>
        <div>hello</div>
      </ThemeProvider>,
    );
    cy.contains('hello');
  });

  it('renders children as plain text content without extra wrapping markup', () => {
    cy.mount(
      <ThemeProvider>
        <span>token world</span>
      </ThemeProvider>,
    );
    cy.contains('span', 'token world').should('be.visible');
  });

  // Mocha has no `it.each`: one `it` per mode, so a dark-only regression names its mode.
  for (const mode of ['light', 'dark'] as const) {
    it(`paints the ${mode} canvas from that mode's tokens`, () => {
      cy.mount(
        <ThemeProvider theme={createAppTheme(mode)}>
          <p>canvas</p>
        </ThemeProvider>,
      );
      const t = tokensFor(mode);
      cy.get('body').should('have.css', 'background-color', hexToRgb(t.background.page));
      // The mist canvas is a flat grey: no dot pattern or glow painted over it.
      cy.get('body').should('have.css', 'background-image', 'none');
      cy.contains('p', 'canvas').should('have.css', 'color', hexToRgb(t.text.primary));
    });
  }
});

/** What Cypress reads a hex colour back as. */
function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
