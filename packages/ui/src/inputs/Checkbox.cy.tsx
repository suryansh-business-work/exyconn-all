import { Checkbox } from './Checkbox';

describe('Checkbox (branded)', () => {
  it('renders unchecked by default', () => {
    cy.mount(<Checkbox slotProps={{
      input: { 'aria-label': 'accept' }
    }} />);
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('toggles checked state and fires onChange on click', () => {
    const onChange = cy.stub().as('change');
    cy.mount(<Checkbox onChange={onChange} slotProps={{
      input: { 'aria-label': 'accept' }
    }} />);
    cy.get('input[type="checkbox"]').click();
    cy.get('@change').should('have.been.calledOnce');
    cy.get('input[type="checkbox"]').should('be.checked');
  });
});
