import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it('humanizes the status label', () => {
    cy.mount(<StatusChip value="IN_PROGRESS" />);
    cy.contains('IN PROGRESS').should('be.visible');
  });

  it('renders a plain single-word status', () => {
    cy.mount(<StatusChip value="ACTIVE" />);
    cy.contains('ACTIVE').should('be.visible');
  });
});
