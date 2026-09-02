import { Paragraph } from './Paragraph';

describe('Paragraph', () => {
  it('renders as a <p> tag with visible text', () => {
    cy.mount(<Paragraph>Body copy</Paragraph>);
    cy.contains('p', 'Body copy').should('be.visible');
  });

  it('applies a custom sx color alongside the default bottom margin', () => {
    cy.mount(<Paragraph sx={{ color: 'red' }}>Colored copy</Paragraph>);
    cy.contains('p', 'Colored copy')
      .should('have.css', 'color', 'rgb(255, 0, 0)')
      .and('have.css', 'margin-bottom');
  });
});
