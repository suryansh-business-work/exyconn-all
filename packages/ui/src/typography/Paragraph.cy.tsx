import { Paragraph } from './Paragraph';

describe('Paragraph', () => {
  it('renders as a <p> tag with visible text', () => {
    cy.mount(<Paragraph>Body copy</Paragraph>);
    cy.contains('p', 'Body copy').should('be.visible');
  });

  it('applies a custom sx color alongside the default bottom margin', () => {
    // A dark red, so the fixture itself passes the WCAG AA contrast check every spec runs.
    cy.mount(<Paragraph sx={{ color: 'rgb(153, 0, 0)' }}>Colored copy</Paragraph>);
    cy.contains('p', 'Colored copy')
      .should('have.css', 'color', 'rgb(153, 0, 0)')
      .and('have.css', 'margin-bottom');
  });
});
