import { ThemeProvider } from './ThemeProvider';

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
});
