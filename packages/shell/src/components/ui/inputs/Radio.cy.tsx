import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

describe('Radio (branded)', () => {
  it('renders unchecked by default', () => {
    cy.mount(<Radio inputProps={{ 'aria-label': 'option-a' }} />);
    cy.get('input[type="radio"]').should('not.be.checked');
  });

  it('becomes checked when selected within a RadioGroup', () => {
    cy.mount(
      <RadioGroup name="demo" defaultValue="a">
        <Radio value="a" inputProps={{ 'aria-label': 'option-a' }} />
        <Radio value="b" inputProps={{ 'aria-label': 'option-b' }} />
      </RadioGroup>,
    );
    cy.get('input[value="b"]').click();
    cy.get('input[value="b"]').should('be.checked');
    cy.get('input[value="a"]').should('not.be.checked');
  });
});
