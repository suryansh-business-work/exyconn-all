import { Switch } from './Switch';

describe('Switch (branded)', () => {
  it('renders unchecked by default', () => {
    cy.mount(
      <Switch
        slotProps={{
          input: { 'aria-label': 'enabled' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('toggles checked state and fires onChange on click', () => {
    const onChange = cy.stub().as('change');
    cy.mount(
      <Switch
        onChange={onChange}
        slotProps={{
          input: { 'aria-label': 'enabled' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').click();
    cy.get('@change').should('have.been.calledOnce');
    cy.get('input[type="checkbox"]').should('be.checked');
  });
});
