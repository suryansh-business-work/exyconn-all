import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { DelegateApprovalsDocument, ListEmployeeOptionsDocument } from '@/graphql/generated';
import { DelegateApprovalsForm } from './delegate.form';

const COLLEAGUE = {
  __typename: 'EmployeeOption',
  id: 'emp-2',
  name: 'Asha Rao',
  email: 'asha@exyconn.com',
  designation: 'Engineering Manager',
  department: 'Engineering',
};

const people = {
  request: { query: ListEmployeeOptionsDocument },
  result: { data: { listEmployeeOptions: [COLLEAGUE] } },
};

/**
 * The dates reach the mutation as full ISO instants, so they carry whatever midnight the
 * runner is in — 15 June in Delhi is `2026-06-14T18:30:00.000Z`. Pinning the exact strings
 * would pass here and fail in CI, so what the mock matches on is the part that is the form's
 * doing: the colleague who was chosen, and a window that is the right way round.
 */
const arranged = {
  request: {
    query: DelegateApprovalsDocument,
    variables: ({ input }: { input: { toEmployeeId: string; fromDate: string; toDate: string } }) =>
      input.toEmployeeId === COLLEAGUE.id && input.toDate >= input.fromDate,
  },
  result: {
    data: {
      delegateApprovals: {
        __typename: 'ApprovalDelegation',
        id: 'delegation-1',
        toName: COLLEAGUE.name,
        fromDate: '2026-06-15T00:00:00.000Z',
        toDate: '2026-06-30T00:00:00.000Z',
        active: true,
      },
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[people, arranged]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <DelegateApprovalsForm onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** Picks the one colleague the mocked options offer. */
const chooseColleague = () => {
  cy.get('input[name="toEmployeeId"]').type('Asha');
  cy.get('ul[role="listbox"]').contains('li', COLLEAGUE.name).click();
};

describe('DelegateApprovalsForm', () => {
  it('asks who covers you and for both ends of the window', () => {
    mount();
    cy.contains('button', 'Arrange cover').click();
    cy.contains('Choose who will cover you').should('be.visible');
    cy.contains('Say when it starts').should('be.visible');
    cy.contains('Say when it ends').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('offers colleagues by name and address, so two people with one name are told apart', () => {
    mount();
    cy.get('input[name="toEmployeeId"]').click();
    cy.get('ul[role="listbox"]').contains('li', `${COLLEAGUE.name} (${COLLEAGUE.email})`);
  });

  it('refuses a window that ends before it begins', () => {
    mount();
    chooseColleague();
    cy.get('input[name="fromDate"]').typeDate('06152026');
    cy.get('input[name="toDate"]').typeDate('06142026');
    cy.contains('button', 'Arrange cover').click();
    cy.contains('The last day cannot be before the first').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('accepts a single-day window, because cover for one day is a real thing to want', () => {
    mount();
    chooseColleague();
    cy.get('input[name="fromDate"]').typeDate('06152026');
    cy.get('input[name="toDate"]').typeDate('06152026');
    cy.contains('button', 'Arrange cover').click();
    cy.contains('The last day cannot be before the first').should('not.exist');
    cy.get('@done').should('have.been.called');
  });

  it('keeps the note short enough to read at a glance', () => {
    mount();
    chooseColleague();
    cy.get('input[name="fromDate"]').typeDate('06152026');
    cy.get('input[name="toDate"]').typeDate('06162026');
    cy.get('input[name="note"]').type('x'.repeat(201), { delay: 0 });
    cy.contains('button', 'Arrange cover').click();
    cy.contains('Keep the note under 200 characters').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('arranges the cover and says so', () => {
    mount();
    chooseColleague();
    cy.get('input[name="fromDate"]').typeDate('06152026');
    cy.get('input[name="toDate"]').typeDate('06302026');
    cy.contains('button', 'Arrange cover').click();
    cy.contains('Your approvals are covered for that window.').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
