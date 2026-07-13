import { Container } from './Container';

describe('Container (branded)', () => {
  it('applies the default maxWidth="lg" class', () => {
    cy.mount(<Container>Content</Container>);
    cy.contains('Content').should('have.class', 'MuiContainer-maxWidthLg');
  });

  it('applies maxWidth="sm" class when overridden', () => {
    cy.mount(<Container maxWidth="sm">Content</Container>);
    cy.contains('Content').should('have.class', 'MuiContainer-maxWidthSm');
  });
});
