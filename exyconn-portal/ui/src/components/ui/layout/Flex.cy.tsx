import { Flex } from './Flex';

describe('Flex (branded)', () => {
  it('defaults to direction="row"', () => {
    cy.mount(
      <Flex data-testid="flex">
        <span>One</span>
        <span>Two</span>
      </Flex>,
    );
    cy.get('[data-testid="flex"]').should('have.css', 'flex-direction', 'row');
  });

  it('renders children in order when direction="column"', () => {
    cy.mount(
      <Flex direction="column" data-testid="flex">
        <span>First</span>
        <span>Second</span>
      </Flex>,
    );
    cy.get('[data-testid="flex"]').should('have.css', 'flex-direction', 'column');
    cy.get('[data-testid="flex"] > *').eq(0).should('contain.text', 'First');
    cy.get('[data-testid="flex"] > *').eq(1).should('contain.text', 'Second');
  });
});
