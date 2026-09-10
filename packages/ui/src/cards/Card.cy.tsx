import { Card } from './Card';
import { theme } from '../theme';

describe('Card (branded)', () => {
  it('renders children', () => {
    cy.mount(<Card>Card content</Card>);
    cy.contains('Card content').should('be.visible');
  });

  it('merges a custom sx alongside the default border-radius', () => {
    // Card asks for `borderRadius: 2`, which MUI resolves against the theme's own shape.
    // Derived rather than written down, so retuning the theme does not fail this test for
    // a change that is working exactly as intended.
    const expected = `${Number(theme.shape.borderRadius) * 2}px`;
    cy.mount(<Card sx={{ backgroundColor: 'rgb(255, 0, 0)' }}>Styled</Card>);
    cy.contains('Styled')
      .should('have.css', 'background-color', 'rgb(255, 0, 0)')
      .and('have.css', 'border-radius', expected);
  });
});
