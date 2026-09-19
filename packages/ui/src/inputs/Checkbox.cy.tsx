import { createRef } from 'react';
import { ThemeProvider } from '../tokens/ThemeProvider';
import { Checkbox } from './Checkbox';

describe('Checkbox (branded)', () => {
  it('renders unchecked by default', () => {
    cy.mount(
      <Checkbox
        slotProps={{
          input: { 'aria-label': 'accept' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('toggles checked state and fires onChange on click', () => {
    const onChange = cy.stub().as('change');
    cy.mount(
      <Checkbox
        onChange={onChange}
        slotProps={{
          input: { 'aria-label': 'accept' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').click();
    cy.get('@change').should('have.been.calledOnce');
    cy.get('input[type="checkbox"]').should('be.checked');
  });
});

describe('Checkbox half-ticked', () => {
  it('uses the native mixed state, not aria-checked', () => {
    cy.mount(
      <ThemeProvider>
        <Checkbox indeterminate slotProps={{ input: { 'aria-label': 'some' } }} />
      </ThemeProvider>,
    );
    cy.get('input[aria-label="some"]').should('not.have.attr', 'aria-checked');
    cy.get('input[aria-label="some"]').should('have.prop', 'indeterminate', true);
  });

  it('keeps a slot given as a function, and the ref it was handed', () => {
    const inputRef = createRef<HTMLInputElement>();
    cy.mount(
      <ThemeProvider>
        <Checkbox indeterminate slotProps={{ input: () => ({ 'aria-label': 'fn' }) }} />
      </ThemeProvider>,
    );
    cy.get('input[aria-label="fn"]').should('not.have.attr', 'aria-checked');
    cy.get('input[aria-label="fn"]').should('have.prop', 'indeterminate', true);
    cy.mount(
      <ThemeProvider>
        <Checkbox slotProps={{ input: { 'aria-label': 'ref', ref: inputRef } as never }} />
      </ThemeProvider>,
    );
    cy.get('input[aria-label="ref"]').then(($input) =>
      expect(inputRef.current).to.equal($input[0]),
    );
  });
});
