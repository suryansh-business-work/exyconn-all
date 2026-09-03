import { Text } from './Text';

describe('Text', () => {
  it('renders as a <span> with visible text by default', () => {
    cy.mount(<Text>Inline copy</Text>);
    cy.contains('span', 'Inline copy').should('be.visible');
  });

  it('renders with weight="bold" applied', () => {
    cy.mount(<Text weight="bold">Bold copy</Text>);
    cy.contains('Bold copy').should('exist').and('be.visible');
  });

  it('renders size="lg" as a subtitle1 variant element with visible text', () => {
    cy.mount(<Text size="lg">Large copy</Text>);
    cy.contains('Large copy').should('be.visible').and('have.class', 'MuiTypography-subtitle1');
  });

  it('renders size="caption"/"overline"/"label" as their matching MUI variants', () => {
    cy.mount(<Text size="caption">Caption copy</Text>);
    cy.contains('Caption copy').should('have.class', 'MuiTypography-caption');
    cy.mount(<Text size="overline">Overline copy</Text>);
    cy.contains('Overline copy').should('have.class', 'MuiTypography-overline');
    cy.mount(<Text size="label">Label copy</Text>);
    cy.contains('Label copy').should('have.class', 'MuiTypography-subtitle2');
  });
});
