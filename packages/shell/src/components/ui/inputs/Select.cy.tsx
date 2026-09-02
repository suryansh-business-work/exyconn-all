import { useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Select } from './Select';

function ControlledSelect() {
  const [value, setValue] = useState('a');
  return (
    <Select
      value={value}
      onChange={(event) => setValue(event.target.value as string)}
      inputProps={{ 'aria-label': 'demo-select' }}
    >
      <MenuItem value="a">Alpha</MenuItem>
      <MenuItem value="b">Beta</MenuItem>
    </Select>
  );
}

describe('Select (branded)', () => {
  it('renders the initial selected value', () => {
    cy.mount(<ControlledSelect />);
    cy.get('[role="combobox"]').should('contain.text', 'Alpha');
  });

  it('updates the displayed value when a different option is selected', () => {
    cy.mount(<ControlledSelect />);
    cy.get('[role="combobox"]').click();
    cy.get('li[role="option"]').contains('Beta').click();
    cy.get('[role="combobox"]').should('contain.text', 'Beta');
  });
});
