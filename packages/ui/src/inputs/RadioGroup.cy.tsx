import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

describe('RadioGroup (branded)', () => {
  it('renders all radio children', () => {
    cy.mount(
      <RadioGroup name="demo" defaultValue="a">
        <Radio value="a" inputProps={{ 'aria-label': 'option-a' }} />
        <Radio value="b" inputProps={{ 'aria-label': 'option-b' }} />
      </RadioGroup>,
    );
    cy.get('input[type="radio"]').should('have.length', 2);
  });

  it('fires onChange with the selected value when a different option is clicked', () => {
    const onChange = cy.stub().as('change');
    cy.mount(
      <RadioGroup name="demo" defaultValue="a" onChange={onChange}>
        <Radio value="a" inputProps={{ 'aria-label': 'option-a' }} />
        <Radio value="b" inputProps={{ 'aria-label': 'option-b' }} />
      </RadioGroup>,
    );
    cy.get('input[value="b"]').click();
    cy.get('@change').should('have.been.calledOnce');
    cy.get('@change').its('args.0.1').should('eq', 'b');
  });
});
