import { MemoryRouter } from 'react-router-dom';
import { PortfolioTable, type PortfolioRow } from './index';

/** A project row, as the health query returns it, with only the fields a test varies. */
const row = (over: Partial<PortfolioRow>): PortfolioRow =>
  ({
    __typename: 'ProjectHealth',
    id: 'p1',
    projectId: 'p1',
    name: 'Website Redesign',
    key: 'WEB',
    status: 'ACTIVE',
    clientName: 'Northwind',
    taskCount: 10,
    doneTaskCount: 4,
    progressPercent: 40,
    openBugCount: 3,
    budgetHours: 100,
    loggedHours: 130,
    budgetUsedPercent: 130,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    timeline: 'OVERDUE',
    teamSize: 4,
    risk: 'HIGH',
    riskReasons: ['Past its end date', 'Over its agreed hours'],
    ...over,
  }) as PortfolioRow;

const ROWS: PortfolioRow[] = [
  row({}),
  row({
    id: 'p2',
    projectId: 'p2',
    name: 'Billing',
    key: 'BILL',
    clientName: '',
    openBugCount: 0,
    budgetHours: null,
    budgetUsedPercent: null,
    loggedHours: 12,
    progressPercent: null,
    doneTaskCount: 0,
    taskCount: 0,
    teamSize: 0,
    timeline: 'NO_DATES',
    risk: 'UNKNOWN',
    riskReasons: [],
  }),
];

const mountTable = (rows: PortfolioRow[], loading = false) =>
  cy.mount(
    <MemoryRouter>
      <PortfolioTable rows={rows} loading={loading} />
    </MemoryRouter>,
  );

describe('PortfolioTable', () => {
  // The portfolio sits on a portal landing page, which is a desktop-width surface. Mounted
  // into Cypress's 500px default the six columns overflow their container, and the axe pass
  // then reports the shared table's horizontal scroller rather than anything about this panel.
  beforeEach(() => cy.viewport(1280, 800));

  it('ranks the projects it is given and shows why each one is rated as it is', () => {
    mountTable(ROWS);

    cy.contains('td', 'Website Redesign').should('be.visible');
    cy.contains('td', 'WEB · Northwind').should('be.visible');
    cy.contains('.MuiChip-label', 'At risk').should('be.visible');
    cy.contains('.MuiChip-label', 'Overdue').should('be.visible');
    cy.contains('td', 'Past its end date').should('be.visible');
    cy.contains('td', 'Over its agreed hours').should('be.visible');
    // Worst first is the server's order; the table must not re-sort it away.
    cy.get('tbody tr').first().should('contain.text', 'Website Redesign');
  });

  it('reports progress, open bugs and hours against the agreed budget', () => {
    mountTable(ROWS);

    cy.contains('td', '40%').should('be.visible');
    cy.contains('td', '4 of 10 tickets').should('be.visible');
    cy.contains('td', '130%').should('be.visible');
    cy.contains('td', '130 of 100 h').should('be.visible');
  });

  it('never invents a figure nobody set up', () => {
    mountTable(ROWS);

    cy.contains('td', 'Not tracked').should('be.visible');
    cy.contains('td', 'No budget').should('be.visible');
    cy.contains('td', '12 h logged').should('be.visible');
    cy.contains('.MuiChip-label', 'Not measured').should('be.visible');
  });

  it('says so plainly when there is nothing to report on', () => {
    mountTable([]);

    cy.contains('No projects to report on yet.').should('be.visible');
  });
});
