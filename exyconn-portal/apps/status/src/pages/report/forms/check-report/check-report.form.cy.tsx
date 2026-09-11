import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ProblemReportStatusDocument } from '@exyconn/shell/graphql/generated';
import { CheckReportForm } from './check-report.form';

const foundMock: MockedResponse = {
  request: { query: ProblemReportStatusDocument, variables: { reference: 'EXY-4KQ7W2' } },
  result: {
    data: {
      problemReportStatus: {
        reference: 'EXY-4KQ7W2',
        status: 'IN_PROGRESS',
        serviceName: 'HR Portal',
        updatedAt: '2026-09-07T10:00:00Z',
      },
    },
  },
};

const missingMock: MockedResponse = {
  request: { query: ProblemReportStatusDocument, variables: { reference: 'EXY-ZZZZZZ' } },
  error: new Error('No report matches that reference'),
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CheckReportForm onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CheckReportForm', () => {
  it('rejects something that is not a reference', () => {
    mount();
    cy.get('input[name="reference"]').type('ticket 42');
    cy.contains('button', 'Check').click();

    cy.contains('looks like EXY-4KQ7W2').should('be.visible');
  });

  it('shows the status of a known report, forgiving case', () => {
    mount([foundMock]);
    cy.get('input[name="reference"]').type('exy-4kq7w2');
    cy.contains('button', 'Check').click();

    cy.contains('EXY-4KQ7W2').should('be.visible');
    cy.contains('IN PROGRESS').should('be.visible');
    cy.contains('HR Portal').should('be.visible');
  });

  it('says when nothing matches', () => {
    mount([missingMock]);
    cy.get('input[name="reference"]').type('EXY-ZZZZZZ');
    cy.contains('button', 'Check').click();

    cy.contains('No report matches').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});
