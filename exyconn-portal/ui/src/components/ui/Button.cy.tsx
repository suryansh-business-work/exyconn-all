import { Button } from './Button';

describe('Button (branded)', () => {
  it('renders and handles clicks', () => {
    cy.mount(<Button onClick={cy.stub().as('click')}>Save</Button>);
    cy.contains('button', 'Save').click();
    cy.get('@click').should('have.been.called');
  });

  it('renders as an anchor when href is provided', () => {
    cy.mount(
      <Button href="https://example.com" target="_blank" rel="noopener">
        Visit
      </Button>,
    );
    cy.contains('a', 'Visit').should('have.attr', 'href', 'https://example.com');
  });
});
