import { CrudFormPage } from './CrudFormPage';

describe('CrudFormPage', () => {
  it('renders the title and the form it hosts', () => {
    cy.mount(
      <CrudFormPage title="New lead" onBack={cy.stub()}>
        <div>Body content</div>
      </CrudFormPage>,
    );
    cy.contains('New lead').should('be.visible');
    cy.contains('Body content').should('be.visible');
  });

  it('goes back to the list from the back link', () => {
    cy.mount(
      <CrudFormPage title="Edit lead" onBack={cy.stub().as('back')} backLabel="Back to CRM">
        <div />
      </CrudFormPage>,
    );
    cy.contains('Back to CRM').click();
    cy.get('@back').should('have.been.called');
  });
});
