import { CrudDialog } from './CrudDialog';

describe('CrudDialog', () => {
  it('renders the title and children when open', () => {
    cy.mount(
      <CrudDialog open title="Edit record" onClose={cy.stub()}>
        <div>Body content</div>
      </CrudDialog>,
    );
    cy.contains('Edit record').should('be.visible');
    cy.contains('Body content').should('be.visible');
  });

  it('calls onClose from the close button', () => {
    cy.mount(
      <CrudDialog open title="Edit record" onClose={cy.stub().as('close')}>
        <div />
      </CrudDialog>,
    );
    cy.get('[aria-label="Close"]').click();
    cy.get('@close').should('have.been.called');
  });
});
