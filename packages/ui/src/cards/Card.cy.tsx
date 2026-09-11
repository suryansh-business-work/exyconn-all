import { Card } from './Card';
import { CARD_RADIUS } from '../tokens/border.token';

describe('Card (branded)', () => {
  it('renders children', () => {
    cy.mount(<Card>Card content</Card>);
    cy.contains('Card content').should('be.visible');
  });

  it('merges a custom sx alongside the default border-radius', () => {
    // Derived from the token rather than written down, so retuning the card corner does not
    // fail this test for a change that is working exactly as intended.
    const expected = `${CARD_RADIUS}px`;
    cy.mount(<Card sx={{ backgroundColor: 'rgb(255, 0, 0)' }}>Styled</Card>);
    cy.contains('Styled')
      .should('have.css', 'background-color', 'rgb(255, 0, 0)')
      .and('have.css', 'border-radius', expected);
  });
});
