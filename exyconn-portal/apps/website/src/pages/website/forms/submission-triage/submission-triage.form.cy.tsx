import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { TriageWebsiteSubmissionDocument } from '@exyconn/shell/graphql/generated';
import { SubmissionTriageForm } from './submission-triage.form';
import type { WebsiteSubmissionRow } from './submission-triage.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const submission: WebsiteSubmissionRow = {
  id: 's1',
  formType: 'contact',
  source: 'exyconn.com/contact',
  submissionData: { name: 'Ada Lovelace', email: 'ada@example.com' },
  status: 'new',
  notes: '',
  createdAt: '2026-01-05T10:00:00.000Z',
};

const NOTES = 'Replied to the customer';

const triageMock: MockedResponse = {
  request: {
    query: TriageWebsiteSubmissionDocument,
    variables: { id: 's1', input: { status: 'resolved', notes: NOTES } },
  },
  result: {
    data: { triageWebsiteSubmission: { id: 's1', status: 'resolved', notes: NOTES } },
  },
};

const mount = (row: WebsiteSubmissionRow, mocks: MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SubmissionTriageForm
            submission={row}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SubmissionTriageForm', () => {
  it('requires a status', () => {
    // A submission with no status yet is the only way the required rule can fire.
    mount({ ...submission, status: '' }, []);
    cy.contains('button', 'Save triage').click();
    cy.contains('Status is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('triages the submission and calls onDone', () => {
    mount(submission, [triageMock]);
    cy.get('[role="combobox"]').click();
    cy.get('li[role="option"]').contains('resolved').click();
    cy.get('textarea[name="notes"]').type(NOTES);
    cy.contains('button', 'Save triage').click();
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount(submission, []);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
