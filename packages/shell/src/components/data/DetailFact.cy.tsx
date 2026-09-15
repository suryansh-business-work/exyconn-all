import { ThemeProvider } from '@/components/ui/styles';
import { theme } from '@/config/theme';
import { DetailFact, DetailFactGrid } from './DetailFact';

describe('DetailFact', () => {
  it('puts the value on its own line, so the label never runs into it', () => {
    cy.mount(
      <ThemeProvider theme={theme}>
        <DetailFactGrid>
          <DetailFact label="Employment">ACTIVE</DetailFact>
          <DetailFact label="Hours per day">8 h</DetailFact>
        </DetailFactGrid>
      </ThemeProvider>,
    );

    cy.contains('Employment').then(($label) => {
      cy.contains('ACTIVE').then(($value) => {
        const label = $label[0].getBoundingClientRect();
        const value = $value[0].getBoundingClientRect();
        expect(value.top).to.be.at.least(label.bottom - 1);
      });
    });
    cy.contains('Hours per day').should('have.css', 'display', 'block');
  });
});
