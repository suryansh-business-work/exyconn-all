import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SubmitProblemReportDocument } from '@exyconn/shell/graphql/generated';
import { ReportProblemForm } from './report-problem.form';

const SERVICES = [{ value: 'hr', label: 'HR Portal' }];

const VALID = {
  subject: 'Leave requests will not open',
  description: 'Opening My Leave shows a spinner that never finishes, on Chrome and Edge.',
  reporterName: 'Asha Rao',
  reporterEmail: 'asha@example.com',
};

const successMock = {
  request: {
    query: SubmitProblemReportDocument,
    variables: {
      input: {
        serviceKey: 'hr',
        category: 'OUTAGE',
        severity: 'MEDIUM',
        subject: VALID.subject,
        description: VALID.description,
        reporterName: VALID.reporterName,
        reporterEmail: VALID.reporterEmail,
        pageUrl: '',
      },
    },
  },
  result: {
    data: { submitProblemReport: { reference: 'EXY-4KQ7W2', submittedAt: '2026-09-03T10:00:00Z' } },
  },
};

const mount = (mocks: unknown[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks as never[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ReportProblemForm
            services={SERVICES}
            onSubmitted={cy.stub().as('submitted')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const fillValidFields = () => {
  cy.get('input[name="subject"]').type(VALID.subject);
  cy.get('textarea[name="description"]').type(VALID.description);
  cy.get('input[name="reporterName"]').type(VALID.reporterName);
  cy.get('input[name="reporterEmail"]').type(VALID.reporterEmail);
};

const chooseService = () => {
  cy.get('[name="serviceKey"]').parent().click();
  cy.contains('li', 'HR Portal').click();
};

describe('ReportProblemForm', () => {
  it('refuses an empty report and says what is missing', () => {
    mount();
    cy.contains('button', 'Send report').click();

    cy.contains('Give the problem a short title').should('be.visible');
    cy.contains('Tell us what happened').should('be.visible');
    cy.contains('Your name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('rejects a malformed email address', () => {
    mount();
    fillValidFields();
    cy.get('input[name="reporterEmail"]').clear().type('asha@');
    cy.contains('button', 'Send report').click();

    cy.contains('Enter a valid email address').should('be.visible');
  });

  it('rejects a description too short to act on', () => {
    mount();
    fillValidFields();
    cy.get('textarea[name="description"]').clear().type('broken');
    cy.contains('button', 'Send report').click();

    cy.contains('at least 20 characters').should('be.visible');
  });

  it('rejects a page address that is not a URL', () => {
    mount();
    fillValidFields();
    cy.get('input[name="pageUrl"]').type('hr portal page');
    cy.contains('button', 'Send report').click();

    cy.contains('starting with http').should('be.visible');
  });

  it('hands the reference back when the report is accepted', () => {
    mount([successMock]);
    chooseService();
    fillValidFields();
    cy.contains('button', 'Send report').click();

    cy.get('@submitted').should('have.been.calledWith', 'EXY-4KQ7W2');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});
