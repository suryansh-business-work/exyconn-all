import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  PayrollCandidateStatus,
  PayrollRunPlanDocument,
  RunPayrollDocument,
  SlipStatus,
} from '@exyconn/shell/graphql/generated';
import { PayrollRunControl } from './PayrollRunControl';

const candidate = (
  employeeId: string,
  name: string,
  status: PayrollCandidateStatus,
  figures: { gross: number; deductions: number; net: number } | null = null,
) => ({
  __typename: 'PayrollCandidate' as const,
  employeeId,
  name,
  department: 'Engineering',
  designation: 'Engineer',
  status,
  slipStatus: status === PayrollCandidateStatus.AlreadyRun ? SlipStatus.Generated : null,
  gross: figures?.gross ?? null,
  deductions: figures?.deductions ?? null,
  net: figures?.net ?? null,
  currency: figures ? 'INR' : null,
});

const EMPLOYEES = [
  candidate('e1', 'Asha', PayrollCandidateStatus.Ready, {
    gross: 50000,
    deductions: 2500,
    net: 47500,
  }),
  candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun),
  candidate('e3', 'Chitra', PayrollCandidateStatus.Ready, {
    gross: 30000,
    deductions: 1000,
    net: 29000,
  }),
  candidate('e4', 'Dev', PayrollCandidateStatus.NoStructure),
];

type Employees = ReturnType<typeof candidate>[];

const planOf = (employees: Employees, open = true) => ({
  __typename: 'PayrollRunPlan' as const,
  month: 10,
  year: 2026,
  // Midday, so the opening date reads the 25th whatever zone the browser is in.
  opensOn: '2026-10-25T06:00:00.000Z',
  open,
  readyCount: employees.filter((c) => c.status === PayrollCandidateStatus.Ready).length,
  alreadyRunCount: employees.filter((c) => c.status === PayrollCandidateStatus.AlreadyRun).length,
  noStructureCount: employees.filter((c) => c.status === PayrollCandidateStatus.NoStructure).length,
  totalGross: 0,
  totalDeductions: 0,
  totalNet: 0,
  employees,
});

const planMock = (employees: Employees = EMPLOYEES, open = true): MockedResponse => ({
  request: { query: PayrollRunPlanDocument, variables: () => true },
  result: { data: { payrollRunPlan: planOf(employees, open) } },
  maxUsageCount: 10,
});

/** Answers the run only when it is for exactly `ids`, so a wrong pick fails the spec. */
const runMock = (ids: string[]): MockedResponse => ({
  request: {
    query: RunPayrollDocument,
    variables: (v: Record<string, unknown>) =>
      v.month === 10 && v.year === 2026 && JSON.stringify(v.employeeIds) === JSON.stringify(ids),
  },
  result: {
    data: { runPayroll: { __typename: 'PayrollRunResult', generated: ids.length, totalNet: 1 } },
  },
});

const mount = (mocks: MockedResponse[]) => {
  cy.viewport(1280, 900);
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <PayrollRunControl
              month={10}
              year={2026}
              period="October 2026"
              onRan={cy.stub().resolves(undefined).as('ran')}
            />
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

const box = (name: string) => cy.get(`input[aria-label="Run payroll for ${name}"]`);
const openDialog = () => cy.contains('button', 'Run payroll').should('be.enabled').click();

describe('PayrollRunControl', () => {
  it('lists every employee, with only the ready ones pickable and all of them picked', () => {
    mount([planMock()]);
    openDialog();
    cy.contains('2 ready · 1 already run · 1 without a salary structure').should('be.visible');
    box('Asha').should('be.checked').and('be.enabled');
    box('Chitra').should('be.checked').and('be.enabled');
    box('Bala').should('not.be.checked').and('be.disabled');
    box('Dev').should('not.be.checked').and('be.disabled');
    cy.contains('tr', 'Bala').within(() => {
      cy.contains('Already run');
      cy.contains('GENERATED');
    });
    cy.contains('tr', 'Dev').within(() => {
      cy.contains('No salary structure');
      cy.contains('a', 'Set one up in Salaries').should('have.attr', 'href', '/hr/salaries');
    });
    cy.get('[role="status"]').should('contain', '2').and('contain', '76,500');
  });

  it('keeps the totals in step with the ticks, and select-all picks every ready employee', () => {
    mount([planMock()]);
    openDialog();
    box('Asha').click();
    cy.get('[role="status"]').should('contain', '29,000').and('not.contain', '76,500');
    cy.get('input[aria-label="Select every ready employee"]').should(
      'have.prop',
      'indeterminate',
      true,
    );
    cy.get('input[aria-label="Select every ready employee"]').click();
    box('Asha').should('be.checked');
    cy.get('[role="status"]').should('contain', '76,500');
    cy.get('input[aria-label="Select every ready employee"]').click();
    box('Chitra').should('not.be.checked');
    cy.contains('button', 'Continue').should('be.disabled');
  });

  it('finds an employee by name', () => {
    mount([planMock()]);
    openDialog();
    cy.get('input').filter('[type="text"]').first().type('chi');
    cy.contains('tr', 'Chitra').should('be.visible');
    cy.contains('tr', 'Asha').should('not.exist');
    cy.get('input').filter('[type="text"]').first().clear().type('nobody');
    cy.contains('No employee matches that search.').should('be.visible');
  });

  it('confirms how many, how much and who, then runs exactly the picked employees', () => {
    mount([planMock(), runMock(['e1', 'e3'])]);
    openDialog();
    cy.contains('button', 'Continue').click();
    cy.contains('Confirm the run for October 2026').should('be.visible');
    cy.contains('Run payroll for 2 employees for October 2026? Total net').should('be.visible');
    cy.contains('76,500').should('be.visible');
    cy.contains('this month cannot be run again for them').should('be.visible');
    cy.contains('li', 'Asha').should('be.visible');
    cy.contains('li', 'Chitra').should('be.visible');
    cy.contains('button', 'Back').click();
    box('Asha').should('exist');
    cy.contains('button', 'Continue').click();
    cy.get('[role="dialog"]').contains('button', 'Run payroll').click();
    cy.contains('Generated 2 salary slips').should('be.visible');
    cy.get('@ran').should('have.been.calledOnce');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it("shows the server's refusal and keeps the dialog open", () => {
    const refused: MockedResponse = {
      request: { query: RunPayrollDocument, variables: () => true },
      error: new Error('Chitra already has a salary slip for this month'),
    };
    mount([planMock(), refused]);
    openDialog();
    cy.contains('button', 'Continue').click();
    cy.get('[role="dialog"]').contains('button', 'Run payroll').click();
    cy.contains('Chitra already has a salary slip for this month').should('be.visible');
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('@ran').should('not.have.been.called');
  });

  it('folds a long list of names behind "Show all"', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      candidate(`m${i}`, `Person ${i}`, PayrollCandidateStatus.Ready, {
        gross: 100,
        deductions: 0,
        net: 100,
      }),
    );
    mount([planMock(many)]);
    openDialog();
    cy.contains('button', 'Continue').click();
    cy.contains('li', 'Person 7').should('be.visible');
    cy.contains('li', 'Person 9').should('not.be.visible');
    cy.contains('button', 'Show all 10').click();
    cy.contains('li', 'Person 9').should('be.visible');
    cy.contains('button', 'Show fewer').should('have.attr', 'aria-expanded', 'true');
  });

  it('cannot run a month that has not opened yet, and says when it opens', () => {
    mount([planMock(EMPLOYEES, false)]);
    cy.contains('Payroll for October 2026 opens on 25 Oct 2026').should('be.visible');
    cy.contains('button', 'Run payroll').should('be.disabled');
  });

  it('cannot run a month already run for everybody', () => {
    mount([planMock([candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun)])]);
    cy.contains('Payroll has already been run for every employee this month').should('be.visible');
    cy.contains('button', 'Run payroll').should('be.disabled');
  });

  it('cannot run a month nobody has a salary structure for', () => {
    mount([planMock([candidate('e4', 'Dev', PayrollCandidateStatus.NoStructure)])]);
    cy.contains('No employee has a salary structure yet').should('be.visible');
    cy.contains('button', 'Run payroll').should('be.disabled');
  });

  it('says why when the plan cannot be read', () => {
    mount([
      {
        request: { query: PayrollRunPlanDocument, variables: () => true },
        error: new Error('You do not have access to payroll'),
      },
    ]);
    cy.contains('You do not have access to payroll').should('be.visible');
    cy.contains('button', 'Run payroll').should('be.disabled');
  });

  it('cancels without running', () => {
    mount([planMock()]);
    openDialog();
    cy.contains('button', 'Cancel').click();
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('@ran').should('not.have.been.called');
  });
});
