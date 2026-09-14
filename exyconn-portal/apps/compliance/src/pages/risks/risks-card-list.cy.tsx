import { MockedProvider } from '@apollo/client/testing/react';
import { RecordCardList } from '@exyconn/crud';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { RISK_COLUMNS, type PagedRiskRow } from './risks-grid';

/** Two rows off a fake server, so the list is exercised with the register's real columns. */
const rows = [
  {
    id: 'r1',
    reference: 'RISK-0001',
    title: 'Laptop theft',
    description: '',
    standards: ['ISO_27001'],
    category: 'INFORMATION_SECURITY',
    subject: 'Endpoints',
    ownerId: 'u1',
    ownerName: 'Asha',
    likelihood: 3,
    impact: 5,
    inherentScore: 15,
    inherentLevel: 'CRITICAL',
    treatment: 'REDUCE',
    controls: '',
    residualLikelihood: 2,
    residualImpact: 2,
    residualScore: 4,
    residualLevel: 'LOW',
    status: 'TREATING',
    identifiedOn: '2026-09-01T00:00:00.000Z',
    reviewDueOn: null,
    closedOn: null,
  },
  {
    id: 'r2',
    reference: 'RISK-0002',
    title: 'Supplier outage',
    description: '',
    standards: ['ISO_9001'],
    category: 'SUPPLIER',
    subject: 'Hosting',
    ownerId: 'u2',
    ownerName: 'Ravi',
    likelihood: 2,
    impact: 4,
    inherentScore: 8,
    inherentLevel: 'MEDIUM',
    treatment: 'TRANSFER',
    controls: '',
    residualLikelihood: 1,
    residualImpact: 3,
    residualScore: 3,
    residualLevel: 'LOW',
    status: 'MONITORING',
    identifiedOn: '2026-09-02T00:00:00.000Z',
    reviewDueOn: null,
    closedOn: null,
  },
] as unknown as PagedRiskRow[];

const mount = (onEdit = cy.stub().as('edit')) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <RecordCardList<PagedRiskRow>
          columnDefs={RISK_COLUMNS}
          fetchRows={() => Promise.resolve({ rows, totalCount: 2 })}
          context={{ actions: { edit: onEdit }, formatDate: (iso: string) => iso.slice(0, 10) }}
          searchPlaceholder="Search risks…"
        />
      </ThemeProvider>
    </MockedProvider>,
  );

describe('the register on a phone', () => {
  beforeEach(() => cy.viewport(390, 844));

  it('shows each record as a card, led by the column the table leads with', () => {
    mount();
    cy.contains('RISK-0001').should('be.visible');
    cy.contains('RISK-0002').should('be.visible');
    cy.contains('Laptop theft').should('be.visible');
  });

  it('keeps the facts under the heading, chips included', () => {
    mount();
    cy.contains('Owner').should('be.visible');
    cy.contains('Asha').should('be.visible');
    cy.contains('TREATING').should('be.visible');
  });

  it('puts the row actions on the card, where a thumb can reach them', () => {
    mount();
    cy.get('[aria-label="edit"]').first().click();
    cy.get('@edit').should('have.been.called');
  });

  it('says how much of the register it is showing', () => {
    mount();
    cy.contains('2 of 2').should('be.visible');
  });
});
