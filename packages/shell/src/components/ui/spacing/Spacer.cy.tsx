import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('renders a vertical box with the md height (16px)', () => {
    cy.mount(<Spacer size="md" axis="vertical" />);
    cy.get('.MuiBox-root').should('have.css', 'height', '16px');
  });

  it('renders a horizontal box with the lg width (24px)', () => {
    cy.mount(<Spacer size="lg" axis="horizontal" />);
    cy.get('.MuiBox-root').should('have.css', 'width', '24px');
  });
});
