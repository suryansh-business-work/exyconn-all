import { Section } from './Section';

describe('Section (branded)', () => {
  it('renders as a <section> tag with children visible', () => {
    cy.mount(<Section>Hello section</Section>);
    cy.get('section').should('be.visible').and('contain.text', 'Hello section');
  });

  it('merges a custom sx alongside the default padding-y', () => {
    // A pale green the default ink reads on, so the fixture passes the AA contrast check.
    cy.mount(<Section sx={{ bgcolor: 'rgb(204, 255, 204)' }}>Styled</Section>);
    cy.get('section')
      .should('have.css', 'padding-top', '32px')
      .and('have.css', 'background-color', 'rgb(204, 255, 204)');
  });
});
