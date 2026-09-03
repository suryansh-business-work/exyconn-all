import { Card } from './Card';

describe('Card (branded)', () => {
  it('renders children', () => {
    cy.mount(<Card>Card content</Card>);
    cy.contains('Card content').should('be.visible');
  });

  it('merges a custom sx alongside the default border-radius', () => {
    // App theme sets shape.borderRadius: 6, so sx borderRadius: 2 -> 12px.
    cy.mount(<Card sx={{ backgroundColor: 'rgb(255, 0, 0)' }}>Styled</Card>);
    cy.contains('Styled')
      .should('have.css', 'background-color', 'rgb(255, 0, 0)')
      .and('have.css', 'border-radius', '12px');
  });
});
