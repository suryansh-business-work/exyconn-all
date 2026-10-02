import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the label and value', () => {
    cy.mount(<StatCard label="Revenue" value="₹1,000" />);
    cy.contains('Revenue').should('be.visible');
    cy.contains('₹1,000').should('be.visible');
  });

  it('shows a trend delta when provided', () => {
    cy.mount(<StatCard label="Users" value="42" delta={12} />);
    cy.contains('12%').should('be.visible');
  });

  it('holds a placeholder, not the value, until the figure arrives', () => {
    cy.mount(<StatCard label="Clients" value="0" loading />);
    cy.contains('Clients').should('be.visible');
    cy.contains('0').should('not.exist');
    cy.get('.MuiSkeleton-root').should('exist');
  });
});
