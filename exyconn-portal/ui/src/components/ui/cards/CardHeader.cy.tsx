import { CardHeader } from './CardHeader';

describe('CardHeader (branded)', () => {
  it('renders the title', () => {
    cy.mount(<CardHeader title="Project Alpha" />);
    cy.contains('Project Alpha').should('be.visible');
  });

  it('renders the subheader alongside the title', () => {
    cy.mount(<CardHeader title="Project Alpha" subheader="Updated today" />);
    cy.contains('Project Alpha').should('be.visible');
    cy.contains('Updated today').should('be.visible');
  });
});
