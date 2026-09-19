import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ActiveLeavePoliciesDocument,
  MyLeaveBalancesDocument,
} from '@exyconn/shell/graphql/generated';
import { ApplyLeaveForm } from './apply-leave.form';
import { LeaveBalanceAside } from './LeaveBalanceAside';

const year = new Date().getFullYear();

const policy = (code: string, name: string) => ({
  __typename: 'LeavePolicy',
  id: code,
  name,
  code,
  annualQuota: 12,
  paid: true,
  halfDayAllowed: false,
  carryForwardCap: 0,
  active: true,
  overrides: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const balance = (code: string, available: number, used: number) => ({
  __typename: 'LeaveBalance',
  id: `b-${code}`,
  employeeId: 'e1',
  leaveTypeCode: code,
  year,
  allocated: available + used,
  carriedForward: 0,
  used,
  adjustment: 0,
  available,
});

const MOCKS = [
  {
    request: { query: ActiveLeavePoliciesDocument },
    result: { data: { activeLeavePolicies: [policy('CL', 'Casual leave')] } },
    maxUsageCount: 5,
  },
  {
    request: { query: MyLeaveBalancesDocument },
    result: { data: { myLeaveBalances: [balance('CL', 3, 9)] } },
    maxUsageCount: 5,
  },
];

const wrap = (children: React.ReactNode) => (
  <MockedProvider mocks={MOCKS}>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <NotificationProvider>{children}</NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </MockedProvider>
);

describe('ApplyLeaveForm', () => {
  it('requires dates and a reason', () => {
    cy.mount(wrap(<ApplyLeaveForm onCancel={cy.stub()} onDone={cy.stub()} />));
    cy.contains('button', 'Apply').click();
    cy.contains('Choose a leave type').should('be.visible');
    cy.contains('From date is required').should('be.visible');
    cy.contains('Reason is required').should('be.visible');
  });

  it('shows the balance beside the form', () => {
    cy.mount(wrap(<ApplyLeaveForm onCancel={cy.stub()} onDone={cy.stub()} />));
    cy.get('aside').within(() => {
      cy.contains(`Your leave balance ${year}`).should('be.visible');
      cy.contains('Casual leave').should('be.visible');
      cy.contains('3 of 12 days').should('be.visible');
    });
  });

  it('asks for the from date before the to date', () => {
    cy.mount(wrap(<ApplyLeaveForm onCancel={cy.stub()} onDone={cy.stub()} />));
    cy.contains('Pick the from date first.').should('be.visible');
  });

  it('calls onCancel', () => {
    const cancel = cy.stub().as('cancel');
    cy.mount(wrap(<ApplyLeaveForm onCancel={cancel} onDone={cy.stub()} />));
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});

describe('LeaveBalanceAside', () => {
  const nameOf = (code: string) => (code === 'CL' ? 'Casual leave' : code);

  it('says how many days the request leaves', () => {
    cy.mount(wrap(<LeaveBalanceAside type="CL" days={2} nameOf={nameOf} />));
    cy.contains('This request uses 2 days; 1 will be left.').should('be.visible');
  });

  it('warns when the request is more than is left', () => {
    cy.mount(wrap(<LeaveBalanceAside type="CL" days={5} nameOf={nameOf} />));
    cy.contains('This request is 5 days but only 3 are left.').should('be.visible');
  });

  it('explains that unpaid leave uses no balance', () => {
    cy.mount(wrap(<LeaveBalanceAside type="UNPAID" days={2} nameOf={nameOf} />));
    cy.contains('Unpaid leave does not use a balance.').should('be.visible');
  });
});
