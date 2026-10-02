import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('says what is missing, why, and offers the way out', () => {
    const onAction = cy.stub().as('onAction');
    cy.mount(
      <EmptyState
        title="No invoices yet"
        description="The first one you draft will be listed here."
        actionLabel="Draft an invoice"
        onAction={onAction}
      />,
    );
    cy.contains('No invoices yet').should('be.visible');
    cy.contains('The first one you draft will be listed here.').should('be.visible');
    cy.contains('button', 'Draft an invoice').click();
    cy.get('@onAction').should('have.been.calledOnce');
  });

  it('shows only the message when there is nothing to do about it', () => {
    cy.mount(<EmptyState title="No tracked time in this range." />);
    cy.contains('No tracked time in this range.').should('be.visible');
    cy.get('button').should('not.exist');
  });
});
