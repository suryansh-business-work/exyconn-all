import { Heading } from './Heading';

describe('Heading', () => {
  it('defaults to level 2 and renders an <h2>', () => {
    cy.mount(<Heading>Section title</Heading>);
    cy.contains('h2', 'Section title').should('exist');
  });

  it('renders an <h1> when level={1}', () => {
    cy.mount(<Heading level={1}>Page title</Heading>);
    cy.contains('h1', 'Page title').should('be.visible');
  });

  it('renders an <h6> when level={6}', () => {
    cy.mount(<Heading level={6}>Minor heading</Heading>);
    cy.contains('h6', 'Minor heading').should('be.visible');
  });
});
